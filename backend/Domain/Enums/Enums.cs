namespace Lex.Api.Domain.Enums;

/// <summary>Subtipo de un perfil de cliente. (perfil_cliente.tipo_cliente)</summary>
public enum TipoCliente
{
    Particular = 0,
    Empresa = 1
}

/// <summary>Estado de verificacion de la relacion estudiante-carrera. (estudiante_carrera.estado_verificacion)</summary>
public enum EstadoVerificacion
{
    Pendiente = 0,
    Verificado = 1,
    Rechazado = 2
}

/// <summary>Estado de una solicitud de demanda abierta. (solicitud.estado)</summary>
public enum EstadoSolicitud
{
    Abierta = 0,
    Cerrada = 1,
    Cancelada = 2
}

/// <summary>Estado de una postulacion a una solicitud. (postulacion.estado)</summary>
public enum EstadoPostulacion
{
    Enviada = 0,
    Aceptada = 1,
    Rechazada = 2
}

/// <summary>Origen del que nace un trabajo. (trabajo.origen)</summary>
public enum OrigenTrabajo
{
    Directo = 0,      // desde un servicio
    Postulacion = 1   // desde una postulacion aceptada
}

/// <summary>Estado del motor transaccional de un trabajo. (trabajo.estado)</summary>
public enum EstadoTrabajo
{
    Pendiente = 0,
    Aceptado = 1,
    EnCurso = 2,
    Completado = 3,
    Cancelado = 4
}

/// <summary>Estado del pago en escrow. (pago.estado)</summary>
public enum EstadoPago
{
    Retenido = 0,
    Liberado = 1,
    Reembolsado = 2
}

/// <summary>
/// Vertical de un servicio. Reemplaza a la vieja tabla lookup 'tipo_servicio':
/// con la jerarquia TPT de Servicio, el tipo queda determinado por la subclase
/// concreta. Se persiste como string donde hace falta guardarlo (catalogo, solicitud).
/// </summary>
public enum TipoServicio
{
    ProyectoCerrado,
    Clase,
    Salud
}

/// <summary>Como entrega el estudiante un proyecto cerrado. (servicio_proyecto_cerrado.formato_entrega)</summary>
public enum FormatoEntrega
{
    Archivos,
    Link,
    Ambos
}

/// <summary>Nivel educativo al que apunta una clase. (servicio_clase.nivel)</summary>
public enum NivelClase
{
    Primario,
    Secundario,
    Universitario,
    Adulto,
    Idioma,
    Otro
}

/// <summary>Modalidad de cursada de una clase. (servicio_clase.modalidad)</summary>
public enum ModalidadClase
{
    Online,
    Presencial,
    Ambas
}

/// <summary>Donde se presta un servicio de salud. (servicio_salud.modalidad)</summary>
public enum ModalidadSalud
{
    Domicilio,
    Consultorio,
    Ambas
}
