using System.ComponentModel.DataAnnotations;
using Lex.Api.Domain.Enums;

namespace Lex.Api.Features.Auth;

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

// Tipo de registro segun el modelo de identidad de LEX.
//   - Una persona se registra como Cliente (Particular o Empresa) o como Agencia.
//   - Estudiante NO es una opcion de registro: se activa despues, y solo si el
//     usuario es un Cliente Particular (POST /api/perfil/activar-estudiante).
public enum TipoRegistro
{
    ClienteParticular,
    ClienteEmpresa,
    Agencia
}

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = null!;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(150)]
    public string NombreCompleto { get; set; } = null!;

    [MaxLength(30)]
    public string? Telefono { get; set; }

    [Required]
    public TipoRegistro TipoRegistro { get; set; }

    // --- Datos opcionales segun el tipo de registro (se pueden completar despues) ---

    // ClienteParticular
    [MaxLength(20)]
    public string? Dni { get; set; }

    // ClienteEmpresa
    [MaxLength(150)]
    public string? RazonSocial { get; set; }

    [MaxLength(20)]
    public string? Cuit { get; set; }

    // Agencia
    [MaxLength(150)]
    public string? NombreAgencia { get; set; }
}

// Representacion segura de un usuario: nunca incluye el password_hash.
public class UsuarioResponse
{
    public int UsuarioId { get; set; }
    public string Email { get; set; } = null!;
    public string NombreCompleto { get; set; } = null!;
    public string? Telefono { get; set; }
    public List<string> Roles { get; set; } = new();

    // Solo si el usuario es Cliente: su subtipo (Particular / Empresa). null en otro caso.
    public TipoCliente? TipoCliente { get; set; }
}

// Respuesta del login: el JWT mas los datos publicos del usuario.
public class AuthResponse
{
    public string Token { get; set; } = null!;
    public DateTime ExpiraEn { get; set; }
    public UsuarioResponse Usuario { get; set; } = null!;
}
