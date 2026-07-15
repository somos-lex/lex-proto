using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Domain.Entities;

// Paciente de un servicio de Salud. Soporta Humano y Animal en la misma tabla
// (discriminador simple 'tipo', NO es TPT). Algunos campos aplican solo a un tipo
// (Dni -> Humano; Especie/Raza -> Animal); se validan en la capa de servicio.
[Table("paciente")]
public class Paciente
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    // Quien gestiona la cuenta del paciente (usuario con perfil de cliente).
    [Column("cliente_responsable_id")]
    public int ClienteResponsableId { get; set; }

    [Column("tipo")]
    public TipoPaciente Tipo { get; set; }

    [Column("nombre_completo")]
    public string NombreCompleto { get; set; } = null!;

    // Solo relevante si Humano: indica si el paciente es el mismo cliente responsable.
    [Column("es_titular")]
    public bool EsTitular { get; set; }

    [Column("fecha_nacimiento")]
    public DateTime? FechaNacimiento { get; set; }

    // Solo Humano.
    [Column("dni")]
    public string? Dni { get; set; }

    // Solo Animal (ej: "Perro", "Gato").
    [Column("especie")]
    public string? Especie { get; set; }

    // Solo Animal.
    [Column("raza")]
    public string? Raza { get; set; }

    [Column("contacto_emergencia_nombre")]
    public string? ContactoEmergenciaNombre { get; set; }

    [Column("contacto_emergencia_telefono")]
    public string? ContactoEmergenciaTelefono { get; set; }

    [Column("notas_relevantes", TypeName = "text")]
    public string? NotasRelevantes { get; set; }

    // Navegacion
    public PerfilCliente ClienteResponsable { get; set; } = null!;
    public ICollection<TrabajoSalud> TrabajosSalud { get; set; } = new List<TrabajoSalud>();
}
