using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Servicios.Shared;
using Microsoft.EntityFrameworkCore;
using static Lex.Api.Features.Practicas.PracticaConsultas;

namespace Lex.Api.Features.Practicas;

// Banco de Turnos, lado del estudiante: publicar la necesidad de un paciente para una
// materia, cancelarla y registrar la comparecencia, que emite la constancia.
//
// Agregado sin dinero: este service no conoce Trabajo, Pago, Turno ni Sesion, y no inyecta
// ningun service del escrow. Cada operacion cierra con un unico SaveChanges: todo se
// commitea junto o nada.
public class PracticaService : IPracticaService
{
    // Estados persistidos que ocupan la agenda del estudiante. Cancelada devuelve el hueco;
    // Vencida no existe en la base (es Publicada con fecha pasada) y queda cubierta por
    // Publicada.
    private static readonly EstadoPracticaClinica[] OcupanAgenda =
    {
        EstadoPracticaClinica.Publicada, EstadoPracticaClinica.Cubierta, EstadoPracticaClinica.Realizada
    };

    private const string IndiceConstanciaPorPractica = "IX_constancia_practica_practica_clinica_id";
    private const string IndiceCodigoConstancia = "IX_constancia_practica_codigo";
    private const int MaxHorasRecordatorio = 168;

    private readonly AppDbContext _db;
    private readonly IServicioPublicacionValidator _validador;

    public PracticaService(AppDbContext db, IServicioPublicacionValidator validador)
    {
        _db = db;
        _validador = validador;
    }

    // --- Publicacion ----------------------------------------------------------

    public async Task<PracticaDetalleResponse> PublicarAsync(int estudianteId, PublicarPracticaRequest request)
    {
        // Rol Estudiante activo + al menos una carrera Verificado: la misma regla que para
        // publicar un servicio. Lo nuevo es el chequeo contra Materia en lugar de catalogo.
        var estudiante = await _validador.ValidarEstudianteAsync(estudianteId);

        var materia = await _db.Materias.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.MateriaId && m.Activa)
            ?? throw new BadRequestException($"La materia {request.MateriaId} no existe o está dada de baja.");

        if (!estudiante.CarrerasVerificadas.Contains(materia.CarreraId))
            throw new BadRequestException(
                $"La materia '{materia.Nombre}' no pertenece a ninguna de tus carreras verificadas.");

        if (estudiante.AnioCursado < materia.AnioMinimo)
            throw new BadRequestException(
                $"Para publicar prácticas de '{materia.Nombre}' necesitás estar en {materia.AnioMinimo}° año " +
                $"o superior (estás en {estudiante.AnioCursado}°).");

        var inicio = ComoUtc(request.FechaHoraInicio);
        var ahora = DateTime.UtcNow;
        if (inicio <= ahora)
            throw new BadRequestException(
                $"La fecha {HorarioArgentina.Describir(inicio)} ya pasó: solo se pueden publicar prácticas futuras.");

        await ValidarSinSolapeAsync(estudianteId, inicio, request.DuracionMinutos);

        var practica = new PracticaClinica
        {
            EstudianteId = estudianteId,
            MateriaId = materia.Id,
            FechaHoraInicio = inicio,
            DuracionMinutos = request.DuracionMinutos,
            Lugar = request.Lugar.Trim(),
            TipoPacienteRequerido = request.TipoPacienteRequerido!.Value,
            RequisitosPrevios = Limpiar(request.RequisitosPrevios),
            Estado = EstadoPracticaClinica.Publicada,
            FechaCreacion = ahora
        };
        _db.PracticasClinicas.Add(practica);
        await _db.SaveChangesAsync();

        return await DetalleAsync(practica.Id);
    }

    // Dos practicas del mismo estudiante no pueden pisarse. Se compara por intervalos en
    // memoria, como ValidadorTurnosService: la duracion es una columna y no se suma en SQL.
    // El margen de un dia hacia atras atrapa la que arranca antes y termina adentro (la
    // duracion maxima es de 8 horas).
    //
    // No se cruza contra los Turno del marketplace: una practica y un turno pago del mismo
    // estudiante pueden solaparse (limitacion documentada en README_PRACTICAS.md).
    private async Task ValidarSinSolapeAsync(int estudianteId, DateTime inicio, int duracionMinutos)
    {
        var fin = inicio.AddMinutes(duracionMinutos);

        var cercanas = await _db.PracticasClinicas.AsNoTracking()
            .Where(p => p.EstudianteId == estudianteId
                        && OcupanAgenda.Contains(p.Estado)
                        && p.FechaHoraInicio < fin
                        && p.FechaHoraInicio >= inicio.AddDays(-1))
            .Select(p => new { p.FechaHoraInicio, p.DuracionMinutos })
            .ToListAsync();

        var choque = cercanas.FirstOrDefault(p => inicio < p.FechaHoraInicio.AddMinutes(p.DuracionMinutos));
        if (choque is not null)
            throw new BadRequestException(
                $"Ya tenés una práctica el {HorarioArgentina.Describir(choque.FechaHoraInicio)} " +
                $"({choque.DuracionMinutos} min) que se superpone con este horario.");
    }

    // --- Consultas del estudiante ---------------------------------------------

    public async Task<IReadOnlyList<PracticaDetalleResponse>> ListarMiasAsync(int estudianteId, EstadoPracticaClinica? estado)
    {
        var ahora = DateTime.UtcNow;
        var query = ConDatosDeLasPartes(_db.PracticasClinicas.AsNoTracking())
            .Where(p => p.EstudianteId == estudianteId);

        if (estado is EstadoPracticaClinica e)
            query = FiltrarPorEstado(query, e, ahora);

        var practicas = await query.OrderBy(p => p.FechaHoraInicio).ToListAsync();
        return practicas.Select(p => ToDetalle(p, ahora)).ToList();
    }

    // --- Cancelacion ----------------------------------------------------------

    // Solo el estudiante cancela la practica: el cliente puede bajar su inscripcion, no la
    // practica que publico otro. Cancelarla arrastra la inscripcion vigente.
    public async Task<PracticaDetalleResponse> CancelarAsync(int estudianteId, int idPractica, string? motivo)
    {
        var practica = await _db.PracticasClinicas
            .Include(p => p.Inscripciones)
            .FirstOrDefaultAsync(p => p.Id == idPractica && p.EstudianteId == estudianteId)
            ?? throw new NotFoundException($"No existe la práctica {idPractica}.");

        if (practica.Estado is not (EstadoPracticaClinica.Publicada or EstadoPracticaClinica.Cubierta))
            throw new BadRequestException($"No se puede cancelar una práctica {practica.Estado}.");

        var ahora = DateTime.UtcNow;
        if (practica.FechaHoraInicio <= ahora)
            throw new BadRequestException(
                $"No se puede cancelar una práctica que ya empezó ({HorarioArgentina.Describir(practica.FechaHoraInicio)}).");

        var motivoLimpio = Limpiar(motivo);
        practica.Estado = EstadoPracticaClinica.Cancelada;
        practica.FechaCancelacion = ahora;
        practica.MotivoCancelacion = motivoLimpio;

        if (Vigente(practica) is { } inscripcion)
        {
            inscripcion.Estado = EstadoInscripcionPractica.Cancelada;
            inscripcion.FechaCancelacion = ahora;
            inscripcion.MotivoCancelacion = motivoLimpio is null
                ? "El estudiante canceló la práctica."
                : $"El estudiante canceló la práctica: {motivoLimpio}";
        }

        await _db.SaveChangesAsync();
        return await DetalleAsync(idPractica);
    }

    // --- Asistencia y constancia ------------------------------------------------

    // Marca la comparecencia y emite la constancia. Solo a partir de FechaHoraInicio: la
    // constancia es evidencia ante la catedra, y emitirla antes de que la practica ocurra la
    // invalida como documento. NoAsistio tambien emite: la ausencia es el dato a documentar.
    public async Task<ConstanciaResponse> RegistrarAsistenciaAsync(
        int estudianteId, int idPractica, bool asistio, string? observaciones)
    {
        var practica = await _db.PracticasClinicas
            .Include(p => p.Materia).ThenInclude(m => m.Carrera).ThenInclude(c => c.Institucion)
            .Include(p => p.Estudiante).ThenInclude(e => e.Usuario)
            .Include(p => p.Inscripciones).ThenInclude(i => i.Paciente)
            .FirstOrDefaultAsync(p => p.Id == idPractica && p.EstudianteId == estudianteId)
            ?? throw new NotFoundException($"No existe la práctica {idPractica}.");

        if (practica.Estado != EstadoPracticaClinica.Cubierta)
            throw new BadRequestException(
                $"Solo se registra asistencia en una práctica con paciente inscripto (esta está {EstadoEfectivo(practica, DateTime.UtcNow)}).");

        var ahora = DateTime.UtcNow;
        if (ahora < practica.FechaHoraInicio)
            throw new BadRequestException(
                $"La práctica todavía no empezó ({HorarioArgentina.Describir(practica.FechaHoraInicio)}): " +
                "la asistencia se registra a partir del horario de inicio.");

        var inscripcion = Vigente(practica)
            ?? throw new InvalidOperationException($"La práctica {idPractica} está Cubierta sin inscripción vigente.");

        inscripcion.Estado = asistio ? EstadoInscripcionPractica.Asistio : EstadoInscripcionPractica.NoAsistio;
        practica.Estado = EstadoPracticaClinica.Realizada;

        var constancia = new ConstanciaPractica
        {
            PracticaClinica = practica,
            Codigo = CodigoConstancia.Generar(),
            FechaEmision = ahora,
            AsistenciaRegistrada = asistio,
            Observaciones = Limpiar(observaciones),
            NombreEstudiante = practica.Estudiante.Usuario.NombreCompleto,
            NombreMateria = practica.Materia.Nombre,
            NombreCarrera = practica.Materia.Carrera.Nombre,
            NombreInstitucion = practica.Materia.Carrera.Institucion.Nombre,
            NombrePaciente = inscripcion.Paciente.NombreCompleto,
            TipoPaciente = inscripcion.Paciente.Tipo,
            FechaPractica = practica.FechaHoraInicio
        };
        _db.ConstanciasPractica.Add(constancia);

        await GuardarConstanciaAsync(constancia);
        return ToConstancia(constancia);
    }

    // El UNIQUE de practica_clinica_id frena la doble emision (doble click: dos requests que
    // leyeron Cubierta). Una colision de codigo es improbable con 40 bits, pero si ocurre se
    // regenera y se reintenta el mismo SaveChanges: la transaccion fallida no dejo nada.
    private async Task GuardarConstanciaAsync(ConstanciaPractica constancia)
    {
        for (var intento = 1; ; intento++)
        {
            try
            {
                await _db.SaveChangesAsync();
                return;
            }
            catch (DbUpdateException ex) when (ErroresPostgres.EsViolacionUnica(ex, IndiceConstanciaPorPractica))
            {
                throw new BadRequestException("La asistencia de esta práctica ya fue registrada.");
            }
            catch (DbUpdateException ex) when (ErroresPostgres.EsViolacionUnica(ex, IndiceCodigoConstancia) && intento < 3)
            {
                constancia.Codigo = CodigoConstancia.Generar();
            }
        }
    }

    // La constancia completa (con el paciente) es de las partes: el estudiante y el cliente
    // de la inscripcion que la origino. Para la catedra existe la verificacion por codigo.
    public async Task<ConstanciaResponse> ObtenerConstanciaAsync(int usuarioId, int idPractica)
    {
        var practica = await _db.PracticasClinicas.AsNoTracking()
            .Include(p => p.Constancia)
            .Include(p => p.Inscripciones)
            .FirstOrDefaultAsync(p => p.Id == idPractica);

        if (practica is null || !EsParte(practica, usuarioId))
            throw new NotFoundException($"No existe la práctica {idPractica}.");

        var constancia = practica.Constancia
            ?? throw new NotFoundException($"La práctica {idPractica} todavía no tiene constancia.");

        return ToConstancia(constancia);
    }

    public async Task<ConstanciaPublicaResponse> VerificarConstanciaAsync(string codigo)
    {
        var normalizado = CodigoConstancia.Normalizar(codigo);

        return await _db.ConstanciasPractica.AsNoTracking()
            .Where(c => c.Codigo == normalizado)
            .Select(c => new ConstanciaPublicaResponse(
                c.Codigo,
                c.FechaEmision,
                c.AsistenciaRegistrada,
                c.NombreEstudiante,
                c.NombreMateria,
                c.NombreCarrera,
                c.NombreInstitucion,
                c.FechaPractica))
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"No existe ninguna constancia con el código {normalizado}.");
    }

    // --- Consultas publicas ---------------------------------------------------

    public async Task<IReadOnlyList<PracticaPublicaResponse>> ListarDisponiblesAsync(
        int? carreraId, TipoPaciente? tipoPaciente, DateOnly? desde, DateOnly? hasta)
    {
        if (desde is DateOnly d && hasta is DateOnly h && h < d)
            throw new BadRequestException($"La fecha 'hasta' ({h:yyyy-MM-dd}) no puede ser anterior a 'desde' ({d:yyyy-MM-dd}).");

        var ahora = DateTime.UtcNow;
        var query = ConDatosPublicos(_db.PracticasClinicas.AsNoTracking())
            .Where(p => p.Estado == EstadoPracticaClinica.Publicada && p.FechaHoraInicio > ahora);

        if (carreraId is int carrera)
            query = query.Where(p => p.Materia.CarreraId == carrera);
        if (tipoPaciente is TipoPaciente tipo)
            query = query.Where(p => p.TipoPacienteRequerido == tipo);

        // Los filtros son fechas argentinas, inclusive ambas: se traducen a la ventana UTC.
        if (desde is DateOnly desdeLocal)
        {
            var inicioUtc = HorarioArgentina.InicioDelDiaUtc(desdeLocal);
            query = query.Where(p => p.FechaHoraInicio >= inicioUtc);
        }
        if (hasta is DateOnly hastaLocal)
        {
            var finUtc = HorarioArgentina.FinDelDiaUtc(hastaLocal);
            query = query.Where(p => p.FechaHoraInicio < finUtc);
        }

        var practicas = await query.OrderBy(p => p.FechaHoraInicio).ToListAsync();
        return practicas.Select(p => ToPublica(p, ahora)).ToList();
    }

    public async Task<PracticaDetalleResponse> ObtenerAsync(int? usuarioId, int idPractica)
    {
        var ahora = DateTime.UtcNow;
        var practica = await ConDatosDeLasPartes(_db.PracticasClinicas.AsNoTracking())
            .FirstOrDefaultAsync(p => p.Id == idPractica)
            ?? throw new NotFoundException($"No existe la práctica {idPractica}.");

        if (usuarioId is int id && EsParte(practica, id))
            return ToDetalle(practica, ahora);

        // Para el resto, una practica que no esta abierta a inscripcion no existe: 404 igual
        // que una inexistente, sin filtrar quien la tomo ni que paso con ella.
        if (EstadoEfectivo(practica, ahora) != EstadoPracticaClinica.Publicada)
            throw new NotFoundException($"No existe la práctica {idPractica}.");

        return new PracticaDetalleResponse(ToPublica(practica, ahora), null, practica.FechaCreacion, null, null, null);
    }

    // --- Recordatorios --------------------------------------------------------

    // Gancho para un scheduler externo: no hay infraestructura de notificaciones en el repo,
    // asi que el endpoint solo dice a quien habria que avisar. El envio queda fuera.
    public async Task<IReadOnlyList<PracticaPorRecordarResponse>> ListarPorRecordarAsync(int horas)
    {
        if (horas is < 1 or > MaxHorasRecordatorio)
            throw new BadRequestException($"La ventana tiene que estar entre 1 y {MaxHorasRecordatorio} horas.");

        var ahora = DateTime.UtcNow;
        var hasta = ahora.AddHours(horas);

        var practicas = await _db.PracticasClinicas.AsNoTracking()
            .Include(p => p.Materia)
            .Include(p => p.Estudiante).ThenInclude(e => e.Usuario)
            .Include(p => p.Inscripciones).ThenInclude(i => i.Cliente).ThenInclude(c => c.Usuario)
            .Include(p => p.Inscripciones).ThenInclude(i => i.Paciente)
            .Where(p => p.Estado == EstadoPracticaClinica.Cubierta
                        && p.FechaHoraInicio > ahora
                        && p.FechaHoraInicio <= hasta)
            .OrderBy(p => p.FechaHoraInicio)
            .ToListAsync();

        return practicas
            .Select(p => (Practica: p, Inscripcion: Vigente(p)))
            .Where(x => x.Inscripcion is not null)
            .Select(x => new PracticaPorRecordarResponse(
                x.Practica.Id,
                x.Practica.FechaHoraInicio,
                x.Practica.Lugar,
                x.Practica.Materia.Nombre,
                x.Practica.EstudianteId,
                x.Practica.Estudiante.Usuario.NombreCompleto,
                x.Practica.Estudiante.Usuario.Email,
                x.Inscripcion!.ClienteId,
                x.Inscripcion.Cliente.Usuario.NombreCompleto,
                x.Inscripcion.Cliente.Usuario.Email,
                x.Inscripcion.Paciente.NombreCompleto))
            .ToList();
    }

    // --- Helpers --------------------------------------------------------------

    // Parte de una practica: el estudiante que la publico o el cliente de la inscripcion
    // VIGENTE (o la que asistio). Un cliente que cancelo deja de ser parte: no tiene por que
    // ver al paciente que se inscribio despues.
    private static bool EsParte(PracticaClinica p, int usuarioId) =>
        p.EstudianteId == usuarioId || Vigente(p)?.ClienteId == usuarioId;

    private static IQueryable<PracticaClinica> ConDatosDeLasPartes(IQueryable<PracticaClinica> query) =>
        ConDatosPublicos(query)
            .Include(p => p.Inscripciones).ThenInclude(i => i.Paciente)
            .Include(p => p.Inscripciones).ThenInclude(i => i.Cliente).ThenInclude(c => c.Usuario)
            .Include(p => p.Constancia)
            .AsSplitQuery();

    private async Task<PracticaDetalleResponse> DetalleAsync(int idPractica)
    {
        var practica = await ConDatosDeLasPartes(_db.PracticasClinicas.AsNoTracking())
            .FirstAsync(p => p.Id == idPractica);
        return ToDetalle(practica, DateTime.UtcNow);
    }

    private static PracticaDetalleResponse ToDetalle(PracticaClinica p, DateTime ahora)
    {
        var vigente = Vigente(p);
        return new PracticaDetalleResponse(
            ToPublica(p, ahora),
            vigente is null ? null : new InscripcionDePracticaResponse(
                vigente.Id,
                vigente.Estado,
                vigente.ClienteId,
                vigente.Cliente.Usuario.NombreCompleto,
                ToPaciente(vigente.Paciente),
                vigente.RequisitosAceptados,
                vigente.FechaAceptacionRequisitos,
                vigente.FechaInscripcion),
            p.FechaCreacion,
            p.FechaCancelacion,
            p.MotivoCancelacion,
            p.Constancia?.Codigo);
    }

    private static string? Limpiar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
