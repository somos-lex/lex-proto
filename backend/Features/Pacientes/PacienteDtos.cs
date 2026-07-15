using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Pacientes;

public class CrearPacienteRequest
{
    [Required]
    public TipoPaciente Tipo { get; set; }

    [Required, MaxLength(150)]
    public string NombreCompleto { get; set; } = null!;

    // Solo relevante si Humano: el paciente es el propio cliente responsable.
    public bool EsTitular { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    // Solo Humano.
    [MaxLength(20)]
    public string? Dni { get; set; }

    // Solo Animal.
    [MaxLength(60)]
    public string? Especie { get; set; }

    [MaxLength(60)]
    public string? Raza { get; set; }

    [MaxLength(150)]
    public string? ContactoEmergenciaNombre { get; set; }

    [MaxLength(40)]
    public string? ContactoEmergenciaTelefono { get; set; }

    [MaxLength(2000)]
    public string? NotasRelevantes { get; set; }
}

public class PacienteResponse
{
    public int Id { get; set; }
    public int ClienteResponsableId { get; set; }
    public TipoPaciente Tipo { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public bool EsTitular { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? Dni { get; set; }
    public string? Especie { get; set; }
    public string? Raza { get; set; }
    public string? ContactoEmergenciaNombre { get; set; }
    public string? ContactoEmergenciaTelefono { get; set; }
    public string? NotasRelevantes { get; set; }
}
