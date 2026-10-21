using Lex.Api.Common;
using Lex.Api.Data;
using Lex.Api.Domain.Entities;
using Lex.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Lex.Api.Features.Materias;

// Materias con practica clinica: el eje academico del Banco de Turnos. Catalogo chico y
// curado por Admin; sin borrado fisico porque las practicas ya publicadas las referencian.
public class MateriaService : IMateriaService
{
    private readonly AppDbContext _db;

    public MateriaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MateriaResponse>> ListarAsync(int? carreraId, bool incluirInactivas)
    {
        var query = _db.Materias.AsNoTracking();

        if (!incluirInactivas)
            query = query.Where(m => m.Activa);
        if (carreraId is int carrera)
            query = query.Where(m => m.CarreraId == carrera);

        return await Proyectar(query.OrderBy(m => m.Carrera.Nombre).ThenBy(m => m.AnioMinimo).ThenBy(m => m.Nombre))
            .ToListAsync();
    }

    // Las materias para las que el estudiante puede publicar HOY: activas, de una carrera
    // que tiene verificada y con año minimo alcanzado. Es exactamente la regla que aplica
    // PracticaService al publicar, asi el selector no ofrece algo que despues se rechaza.
    public async Task<IReadOnlyList<MateriaResponse>> ListarHabilitadasAsync(int estudianteId)
    {
        var anioCursado = await _db.PerfilesEstudiante.AsNoTracking()
            .Where(p => p.UsuarioId == estudianteId)
            .Select(p => p.AnioCursado)
            .FirstOrDefaultAsync() ?? 0;

        var carrerasVerificadas = _db.EstudianteCarreras
            .Where(ec => ec.EstudianteId == estudianteId && ec.EstadoVerificacion == EstadoVerificacion.Verificado)
            .Select(ec => ec.CarreraId);

        var query = _db.Materias.AsNoTracking()
            .Where(m => m.Activa
                        && carrerasVerificadas.Contains(m.CarreraId)
                        && m.AnioMinimo <= anioCursado)
            .OrderBy(m => m.Carrera.Nombre).ThenBy(m => m.AnioMinimo).ThenBy(m => m.Nombre);

        return await Proyectar(query).ToListAsync();
    }

    public async Task<MateriaResponse> CrearAsync(CrearMateriaRequest request)
    {
        if (!await _db.Carreras.AnyAsync(c => c.CarreraId == request.CarreraId))
            throw new BadRequestException($"No existe la carrera {request.CarreraId}.");

        var materia = new Materia
        {
            Nombre = request.Nombre.Trim(),
            CarreraId = request.CarreraId,
            AnioMinimo = request.AnioMinimo,
            Activa = true
        };
        _db.Materias.Add(materia);

        await GuardarAsync(materia.Nombre);
        return await ObtenerAsync(materia.Id);
    }

    public async Task<MateriaResponse> ActualizarAsync(int id, ActualizarMateriaRequest request)
    {
        var materia = await BuscarAsync(id);
        materia.Nombre = request.Nombre.Trim();
        materia.AnioMinimo = request.AnioMinimo;

        await GuardarAsync(materia.Nombre);
        return await ObtenerAsync(id);
    }

    // Desactivar no toca las practicas ya publicadas: solo impide publicar nuevas.
    public async Task<MateriaResponse> CambiarActivaAsync(int id, bool activa)
    {
        var materia = await BuscarAsync(id);
        materia.Activa = activa;
        await _db.SaveChangesAsync();
        return await ObtenerAsync(id);
    }

    private async Task GuardarAsync(string nombre)
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ErroresPostgres.EsViolacionUnica(ex))
        {
            throw new BadRequestException($"Ya existe una materia '{nombre}' en esa carrera.");
        }
    }

    private async Task<Materia> BuscarAsync(int id) =>
        await _db.Materias.FirstOrDefaultAsync(m => m.Id == id)
        ?? throw new NotFoundException($"No existe la materia {id}.");

    private async Task<MateriaResponse> ObtenerAsync(int id) =>
        await Proyectar(_db.Materias.AsNoTracking().Where(m => m.Id == id)).FirstAsync();

    private static IQueryable<MateriaResponse> Proyectar(IQueryable<Materia> query) =>
        query.Select(m => new MateriaResponse(
            m.Id,
            m.Nombre,
            m.CarreraId,
            m.Carrera.Nombre,
            m.Carrera.Institucion.Nombre,
            m.AnioMinimo,
            m.Activa));
}
