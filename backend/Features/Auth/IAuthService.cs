
namespace Lex.Api.Features.Auth;

public interface IAuthService
{
    Task<UsuarioResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
