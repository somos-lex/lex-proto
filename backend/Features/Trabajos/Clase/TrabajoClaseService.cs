using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Lex.Api.Features.Pagos;
using Lex.Api.Features.Trabajos.Shared;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Trabajos.Clase;

public class TrabajoClaseService : ITrabajoClaseService
{
    private readonly AppDbContext _db;
    private readonly IPagoService _pagos;

    public TrabajoClaseService(AppDbContext db, IPagoService pagos)
    {
        _db = db;
        _pagos = pagos;
    }

    public async Task<TrabajoClaseResponse> ContratarAsync(int clienteId, ContratarTrabajoClaseRequest request)
    {
        if (!await _db.PerfilesCliente.AnyAsync(p => p.UsuarioId == clienteId))
            throw new ForbiddenException("Solo los clientes pueden contratar servicios.");

        var servicioBase = await _db.Servicios.FirstOrDefaultAsync(s => s.Id == request.ServicioId)
            ?? throw new NotFoundException($"No existe el servicio {request.ServicioId}.");

        if (servicioBase is not ServicioClase servicio)
            throw new BadRequestException("Este servicio no es de clases.");

        if (!servicio.Activo)
            throw new BadRequestException("El servicio no está disponible para contratar.");

        if (servicio.EstudianteId == clienteId)
            throw new BadRequestException("No podés contratar tu propio servicio.");

        var cantidadSesiones = ResolverCantidadSesiones(servicio, request.CantidadSesiones);

        var ahora = DateTime.UtcNow;
        var trabajo = new TrabajoClase
        {
            ServicioId = servicio.Id,
            ClienteId = clienteId,
            EstudianteId = servicio.EstudianteId,
            TituloSnapshot = servicio.Titulo,
            DescripcionSnapshot = servicio.Descripcion,
            PrecioAcordado = servicio.Precio,
            Estado = EstadoTrabajo.Pendiente,
            FechaCreacion = ahora,
            MateriaSnapshot = servicio.Materia,
            NivelSnapshot = servicio.Nivel,
            ModalidadSnapshot = servicio.Modalidad,
            DuracionMinutosSesionSnapshot = servicio.DuracionMinutosSesion,
            EsPaqueteSnapshot = servicio.EsPaquete,
            CantidadSesionesTotales = cantidadSesiones,
            SesionesCompletadas = 0
        };
        trabajo.Historiales.Add(new TrabajoHistorial
        {
            EstadoAnterior = null,
            EstadoNuevo = EstadoTrabajo.Pendiente,
            Fecha = ahora,
            UsuarioId = clienteId
        });

        _db.TrabajosClase.Add(trabajo);
        // Contratar retiene la plata: el trabajo nace junto con su escrow en un solo commit.
        _pagos.CrearPagoParaTrabajo(trabajo);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(clienteId, trabajo.Id);
    }

    // Paquete: la cantidad debe coincidir con la del paquete. Sesion suelta: 1 por
    // defecto, o mas si el cliente reserva varias.
    private static int ResolverCantidadSesiones(ServicioClase servicio, int? pedidas)
    {
        if (servicio.EsPaquete)
        {
            var totalPaquete = servicio.CantidadSesionesPaquete ?? 0;
            if (totalPaquete <= 0)
                throw new BadRequestException("El servicio es un paquete pero no define la cantidad de sesiones.");
            if (pedidas is int p && p != totalPaquete)
                throw new BadRequestException($"Este servicio es un paquete de {totalPaquete} sesiones; la cantidad debe coincidir.");
            return totalPaquete;
        }

        var cantidad = pedidas ?? 1;
        if (cantidad < 1)
            throw new BadRequestException("La cantidad de sesiones debe ser al menos 1.");
        return cantidad;
    }

    public async Task<TrabajoClaseResponse> ObtenerAsync(int usuarioId, int idTrabajo)
    {
        var t = await _db.TrabajosClase.AsNoTracking()
            .Include(x => x.Cliente).ThenInclude(c => c.Usuario)
            .Include(x => x.Estudiante).ThenInclude(e => e.Usuario)
            .FirstOrDefaultAsync(x => x.Id == idTrabajo)
            ?? throw new NotFoundException($"No existe el trabajo de clase {idTrabajo}.");

        if (t.EstudianteId != usuarioId && t.ClienteId != usuarioId)
            throw new ForbiddenException("No participás en este trabajo.");

        return Map(t);
    }

    public static TrabajoClaseResponse Map(TrabajoClase t)
    {
        var r = new TrabajoClaseResponse
        {
            MateriaSnapshot = t.MateriaSnapshot,
            NivelSnapshot = t.NivelSnapshot,
            ModalidadSnapshot = t.ModalidadSnapshot,
            DuracionMinutosSesionSnapshot = t.DuracionMinutosSesionSnapshot,
            EsPaqueteSnapshot = t.EsPaqueteSnapshot,
            CantidadSesionesTotales = t.CantidadSesionesTotales,
            SesionesCompletadas = t.SesionesCompletadas
        };
        return r.LlenarBase(t);
    }
}
