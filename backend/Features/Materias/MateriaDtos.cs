using System.ComponentModel.DataAnnotations;

namespace Lex.Api.Features.Materias;

public record MateriaResponse(
    int Id,
    string Nombre,
    int CarreraId,
    string CarreraNombre,
    string InstitucionNombre,
    int AnioMinimo,
    bool Activa
);

// POST /api/materias (Admin). Los atributos van sobre el parametro del constructor: en un
// record posicional MVC rechaza la metadata puesta en la propiedad.
public record CrearMateriaRequest(
    [Required, MaxLength(200)] string Nombre,
    [Range(1, int.MaxValue)] int CarreraId,
    [Range(1, 10)] int AnioMinimo
);

// PUT /api/materias/{id} (Admin). La carrera no se cambia: las practicas ya publicadas se
// validaron contra ella.
public record ActualizarMateriaRequest(
    [Required, MaxLength(200)] string Nombre,
    [Range(1, 10)] int AnioMinimo
);
