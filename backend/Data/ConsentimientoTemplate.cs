using Lex.Api.Domain.Entities;

namespace Lex.Api.Data;

// Genera el texto del consentimiento informado a partir del trabajo de salud.
// Template basico: en futuras iteraciones se puede parametrizar por tipo de
// practica, agregar clausulas especificas, etc.
public static class ConsentimientoTemplate
{
    public static string Generar(TrabajoSalud trabajo, Paciente paciente, string estudianteNombre)
    {
        return $@"CONSENTIMIENTO INFORMADO PARA PRÁCTICA DE SALUD SUPERVISADA

Por el presente, el/la abajo firmante manifiesta:

1. Que ha sido debidamente informado/a acerca del servicio de {trabajo.CatalogoServicioNombreSnapshot} a realizarse sobre el paciente {paciente.NombreCompleto} ({paciente.Tipo}).

2. Que el/la estudiante {estudianteNombre} realizará la práctica bajo supervisión del profesional {trabajo.SupervisorNombreSnapshot}, Matrícula N° {trabajo.SupervisorMatriculaSnapshot}.

3. Que comprende que se trata de una práctica estudiantil supervisada, con los alcances y limitaciones propios del año de cursada del estudiante.

4. Que ha tenido oportunidad de hacer preguntas y aclarar dudas.

5. Que acepta las condiciones y autoriza la realización de la práctica descrita.

Fecha de aceptación: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC.

Este consentimiento queda registrado en la plataforma LEX como evidencia de aceptación.";
    }
}
