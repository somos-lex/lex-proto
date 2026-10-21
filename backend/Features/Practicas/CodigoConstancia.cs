using System.Security.Cryptography;

namespace Lex.Api.Features.Practicas;

// Codigo publico de una constancia: LEX-XXXX-XXXX.
//
// Los 8 caracteres salen de un generador CRIPTOGRAFICO (RandomNumberGenerator) sobre el
// alfabeto Crockford base32, que excluye I, L, O y U para que el codigo se pueda dictar y
// copiar a mano sin ambiguedad. Son 40 bits: nunca derivado del id ni secuencial, porque
// GET /api/constancias/{codigo} es publico y un codigo enumerable permitiria listar
// estudiantes y materias desde afuera.
public static class CodigoConstancia
{
    private const string Alfabeto = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    private const string Prefijo = "LEX-";

    public static string Generar()
    {
        Span<char> c = stackalloc char[8];
        for (var i = 0; i < c.Length; i++)
            c[i] = Alfabeto[RandomNumberGenerator.GetInt32(Alfabeto.Length)];

        return $"{Prefijo}{new string(c[..4])}-{new string(c[4..])}";
    }

    // Normaliza lo que tipea una persona: mayusculas, sin espacios, y las confusiones
    // clasicas de Crockford (O por 0, I/L por 1). Asi "lex-7k3m-9qxr" o "LEX-7K3M-9QXR "
    // encuentran la misma constancia.
    public static string Normalizar(string codigo)
    {
        var limpio = codigo.Trim().ToUpperInvariant();
        if (limpio.StartsWith(Prefijo, StringComparison.Ordinal))
            limpio = limpio[Prefijo.Length..];

        // Solo el cuerpo: el prefijo "LEX" lleva una L que no hay que tocar.
        return Prefijo + limpio.Replace('O', '0').Replace('I', '1').Replace('L', '1');
    }
}
