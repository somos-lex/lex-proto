# Banco de Turnos — prácticas clínicas en LEX

## Qué es y por qué es un agregado aparte

El marketplace va en una dirección: el estudiante ofrece un servicio, el cliente lo contrata y paga, y la plata queda en escrow. El Banco de Turnos va en la **dirección contraria y sin dinero**: el estudiante de una carrera con práctica clínica obligatoria **publica la necesidad de un paciente** para una materia, y una persona **se inscribe sin costo**. Se encuentran en la cátedra, la práctica se hace bajo supervisión docente y el sistema registra la comparecencia con una **constancia** verificable.

Por eso es un agregado nuevo y no una cuarta vertical de `Servicio`/`Trabajo`:

- **No toca dinero en ningún punto**: no hay `Pago`, `Trabajo`, `Sesion`, comisión ni movimientos contables. Los services del módulo no inyectan `PagoService`, `TrabajoService`, `TurnoService` ni `SesionService`, y no hay ninguna FK hacia esas tablas.
- **No hereda los bugs abiertos del escrow.** Reusar la máquina de estados de `Trabajo` habría traído sus transiciones de disputa y reembolso, que hoy tienen problemas conocidos.
- **El eje es académico, no comercial.** Lo que habilita a publicar es la materia de una carrera verificada, no una entrada del catálogo de servicios.

## Prerrequisito: verificación de estudiantes

Hasta este módulo, `EstadoVerificacion.Verificado` solo lo seteaban `DbSeeder` y `DemoService`: ningún estudiante real podía publicar nada. La bandeja de Admin lo resuelve (migración `VerificacionEstudiantes`, en un commit propio para poder revertirla sin arrastrar el módulo).

| Endpoint | Regla |
|---|---|
| `GET /api/admin/verificaciones/pendientes` | Vínculos `Pendiente`, más viejos primero, con estudiante, carrera, institución, año cursado y comprobante. |
| `POST /api/admin/verificaciones/{estudianteId}/{carreraId}/aprobar` | Desde `Pendiente` **o `Rechazado`**. Body `{ observaciones? }`. |
| `POST /api/admin/verificaciones/{estudianteId}/{carreraId}/rechazar` | Solo desde `Pendiente`. Body `{ motivo }` obligatorio. |

- **La ruta usa la clave compuesta** porque `estudiante_carrera` no tiene `Id` propio, y no se le agrega uno solo para acomodar una ruta.
- **Aprobar desde `Rechazado`** es deliberado: el rechazo típico va a ser una foto ilegible de la constancia de alumno regular, y dejar a esa persona bloqueada para siempre sería un bug de producto.
- Se registra **quién resolvió** (`verificado_por_usuario_id`) y **cuándo** (`fecha_verificacion`, que ahora significa "última resolución").
- **El comprobante es un link**, no un archivo. El estudiante lo carga al activar su perfil (`documentoComprobante` en `POST /api/perfil/activar-estudiante`, solo http/https), por ejemplo un PDF de la constancia de alumno regular compartido en Drive. La bandeja lo muestra como "Abrir comprobante". El prototipo no tiene almacenamiento de archivos, y hasta este cambio `documento_comprobante` no lo seteaba nadie: el admin aprobaba sin ver nada. Es opcional, y la bandeja avisa cuando falta.

## Modelo

| Tabla | Para qué | Decisiones |
|---|---|---|
| `materia` | Eje académico: carrera + año mínimo. | UNIQUE `(carrera_id, nombre)`. Baja lógica (`activa`), porque las prácticas la referencian. |
| `practica_clinica` | La necesidad publicada. | `estado` como string. `arancel` nullable y **sin ninguna lógica** (ver abajo). |
| `inscripcion_practica` | Un paciente inscripto, sin costo. | **Índice único parcial** sobre `practica_clinica_id` `WHERE estado <> 'Cancelada'`. |
| `constancia_practica` | Evidencia de la comparecencia. | Una por práctica (UNIQUE), código UNIQUE, snapshots por valor. |

Todas las FKs son `Restrict` (las define el loop global de `AppDbContext`): son registros de evidencia académica y no se borran en cascada.

### Por qué el cupo vive en la base

El cupo del MVP es **un paciente por práctica**. El service chequea que la práctica esté `Publicada` antes de inscribir, pero ese chequeo solo da el mensaje claro. Si dos personas se inscriben al mismo tiempo, las dos leen `Publicada`. Lo único que deja pasar a una sola es el índice único parcial, porque no existe otra garantía sin bloqueos explícitos. La violación (SQLSTATE 23505) se atrapa en el service y se traduce a 400, ya que el middleware solo conoce 400/403/404 y la dejaría llegar como 500. Las inscripciones canceladas quedan fuera del índice y se conservan como historial.

### Por qué snapshots en la constancia

Por el mismo motivo que en `Trabajo`: la constancia es **evidencia** y tiene que sobrevivir a que mañana cambie el nombre de la materia, la carrera o el perfil del estudiante. Se guardan `nombre_estudiante`, `nombre_materia`, `nombre_carrera`, `nombre_institucion`, `nombre_paciente`, `tipo_paciente` y `fecha_practica`. Sin la institución, "Odontología" a secas es ambigua.

### `Arancel`

Existe una hipótesis comercial abierta sobre si la prestación debe ser gratuita o de precio bajo. El campo es el **punto de extensión** para esa decisión, y hoy está siempre en null. No se lee, no se valida y no viaja en ningún request ni response. Cuando se decida, se le agrega lógica con su propia migración y tests.

## Estados

```
Publicada ──inscripción──► Cubierta ──asistencia──► Realizada
    │                         │
    │                         └──se cancela la inscripción──► Publicada
    ├──cancelar (futura)──► Cancelada ◄──cancelar (futura)── Cubierta
    └──pasa la fecha──► Vencida   (calculado, nunca persistido)
```

- **`Vencida` no se persiste.** Es una `Publicada` cuyo `fecha_hora_inicio` ya llegó, y se resuelve al leer, sin job programado. Un job sería infraestructura nueva, y en el instante entre que vence y que el job corre habría dos verdades. El corte es el **inicio** y no el fin, porque desde el inicio ya no se puede inscribir nadie. Filtrar por `?estado=Vencida` o `?estado=Publicada` se traduce a un predicado sobre el estado persistido más la fecha (`PracticaConsultas`).
- **Inscripción**: `Inscripta → Asistio | NoAsistio`, o `Inscripta → Cancelada`. **No hay estado de confirmación.** Un valor de enum sin transición que lo alcance es una trampa para quien lea el código después; este repo ya arrastra esa deuda con `ParcialmenteLiberado`. Si el paciente no sirve para la práctica, el estudiante cancela la inscripción y la práctica vuelve a `Publicada`. Si algún día hace falta un paso de confirmación, se agrega con su migración.
- Una `Cubierta` cuya fecha pasó sin registrar asistencia **sigue `Cubierta`**: no se puede cancelar hacia atrás, así que la única salida es que el estudiante marque la asistencia.

## Reglas

### Publicación

- `ServicioPublicacionValidator.ValidarEstudianteAsync` se reutiliza tal cual: rol Estudiante activo y al menos una carrera `Verificado`. Lo nuevo es el chequeo contra `Materia`, que tiene que estar activa, pertenecer a una de esas carreras, y exigir un año mínimo que `AnioCursado` alcance.
- `GET /api/materias/habilitadas` devuelve exactamente lo que pasaría esa validación, para que el selector del frontend no ofrezca algo que después se rechaza.
- `FechaHoraInicio` futura y duración entre 15 y 480 minutos.
- Sin solape con otra práctica del mismo estudiante en `Publicada | Cubierta | Realizada`. Se compara por intervalos en memoria, como `ValidadorTurnosService`.

### Inscripción

- La práctica tiene que estar `Publicada` y ser futura. Requiere perfil de cliente.
- El paciente tiene que pertenecer al cliente que inscribe. Uno ajeno responde **404**, igual que uno inexistente.
- `Paciente.Tipo` tiene que coincidir con `TipoPacienteRequerido`, y `requisitosAceptados` tiene que venir en `true`. Se guarda el timestamp de la aceptación.
- **El estudiante no puede inscribirse en su propia práctica.** Todo estudiante es también Cliente Particular, así que tiene perfil de cliente y pacientes propios.

### Asistencia

- Solo la registra el estudiante, solo sobre una práctica `Cubierta`, y **solo a partir de `FechaHoraInicio`**. La constancia es evidencia ante la cátedra: emitirla antes de que la práctica ocurra la invalida como documento. Acá no se replica la rareza del marketplace, donde existen turnos `Realizado` con fecha futura.
- `asistio` es obligatorio en el body. Si fuera un `bool` común, un body sin el campo valdría `false` y emitiría en silencio una constancia de inasistencia.
- `NoAsistio` **también emite constancia**, con `asistencia_registrada = false`: la ausencia del paciente es justamente el dato que el estudiante necesita documentar.
- La práctica pasa a `Realizada`, la inscripción a `Asistio`/`NoAsistio` y se crea la constancia, todo en un único `SaveChanges`.

### Cancelación

- **La práctica solo la cancela el estudiante**, y eso arrastra la inscripción vigente. El cliente no puede dar de baja algo que publicó otro.
- **La inscripción la cancela cualquiera de las dos partes.** Para el cliente es "no puedo ir"; para el estudiante, "el paciente no sirve". En los dos casos la práctica vuelve a `Publicada`.
- No se cancela hacia atrás, y en el prototipo no hay plazo mínimo de anticipación.

### Visibilidad

`GET /api/practicas/{id}` es público, pero un visitante solo ve prácticas `Publicada` y futuras. Para cualquier otro estado responde **404**, igual que si no existiera: no se filtra quién la tomó ni qué pasó con ella.

Las partes ven todo, incluido el paciente: el estudiante dueño y el cliente de la inscripción vigente o de la que asistió. Un cliente que canceló deja de ser parte, porque no tiene por qué ver al paciente que se inscribió después.

### Constancia y verificación pública

- El código tiene la forma `LEX-XXXX-XXXX`: 8 caracteres de `RandomNumberGenerator` sobre el alfabeto Crockford base32, que excluye `I L O U` para poder dictarlo y copiarlo a mano. Son 40 bits.
- **Nunca se deriva del id ni es secuencial.** El endpoint de verificación es público, y un código enumerable permitiría listar desde afuera estudiantes y sus materias.
- Al buscar se normaliza: mayúsculas, `O→0`, `I/L→1`.
- `GET /api/constancias/{codigo}` devuelve **solo** estudiante, materia, carrera, institución, fecha y asistencia. **Ningún dato del paciente**, ni el nombre.
- `GET /api/practicas/{id}/constancia` devuelve la constancia completa, pero solo a las partes.
- La doble emisión (doble click) la frena el UNIQUE de `practica_clinica_id` y responde 400.

## Endpoints

| Endpoint | Acceso |
|---|---|
| `POST /api/practicas` | Estudiante |
| `GET /api/practicas/mias?estado=` | Estudiante |
| `POST /api/practicas/{id}/cancelar` `{ motivo? }` | Estudiante dueño |
| `POST /api/practicas/{id}/asistencia` `{ asistio, observaciones? }` | Estudiante dueño |
| `GET /api/practicas/{id}/constancia` | Partes |
| `GET /api/practicas/disponibles?carreraId=&tipoPaciente=&desde=&hasta=` | Público. Fechas locales AR, inclusive. |
| `GET /api/practicas/{id}` | Público / partes |
| `POST /api/practicas/{id}/inscripcion` `{ pacienteId, requisitosAceptados }` | Usuario con perfil de cliente |
| `GET /api/inscripciones/mias` | Cliente |
| `POST /api/inscripciones/{id}/cancelar` `{ motivo? }` | Cliente o estudiante de la práctica |
| `GET /api/constancias/{codigo}` | Público |
| `GET /api/practicas/por-recordar?horas=24` | Admin. Ventana de 1 a 168 h. |
| `GET /api/materias?carreraId=` | Público (un Admin puede sumar `incluirInactivas=true`) |
| `GET /api/materias/habilitadas` | Estudiante |
| `POST /api/materias`, `PUT /api/materias/{id}`, `POST /api/materias/{id}/activar\|desactivar` | Admin |

Las rutas por id llevan `{id:int}` para no chocar con `mias`, `disponibles` y `por-recordar`.

**Recordatorios.** No hay infraestructura de notificaciones en el repo. `por-recordar` solo dice a quién habría que avisar: devuelve las prácticas `Cubierta` que arrancan dentro de la ventana, con los emails del estudiante y del cliente. Es el gancho para un scheduler externo; el envío queda fuera de alcance.

## Zona horaria

Igual que el resto de la agenda (ver `README_TURNOS.md`):
- En la base, todo es UTC (`timestamptz`).
- El prototipo asume Argentina, UTC-3 fijo sin horario de verano (`Common/HorarioArgentina.cs`).
- Los filtros `desde`/`hasta` son fechas locales AR.
- El frontend formatea corriendo el instante 3 horas y leyéndolo como UTC (`lib/practicas.ts`). Así el resultado es el mismo en el servidor y en cualquier navegador.

## Seed de materias

El prototipo se va a mostrar a estudiantes de estas facultades. Una materia que no existe o un año mal puesto cuesta credibilidad justo con la gente que hay que convencer, así que, a diferencia del catálogo de servicios (marcado "de ejemplo"), **cada materia sale de un plan de estudios oficial**. `anio_minimo` es el año del plan en que se cursa, y solo se siembran materias con atención de pacientes.

| Carrera | Fuente | Materias (año) |
|---|---|---|
| Odontología | [FOUNNE, Plan de Estudios 134/2023](https://www.odn.unne.edu.ar/wp-content/uploads/2026/06/PLAN-DE-ESTUDIO-134-2023.pdf) | Práctica Clínica Preventiva (3), Clínica Rehabilitadora (4), Periodoncia (4), Clínica Integral Adulto (5), Clínica en Odontopediatría (5) |
| Medicina Veterinaria | [FCV UNNE, Res. 637/08-CS (plan 2008)](https://vet.unne.edu.ar/wp-content/uploads/2023/08/Res637-08CS.pdf) | Semiología (3), Cirugía y Anestesiología (4), Clínica de Pequeños Animales (5), Clínica de Grandes Animales (5) |
| Licenciatura en Kinesiología y Fisiatría | [Facultad de Medicina UNNE](https://med.unne.edu.ar/carreras/licenciatura-en-kinesiologia-y-fisiatria/) (Res. 501/03-CS y modif.) | Técnicas Evaluativas Funcionales (3), Kinesiterapia I (3), Clínica Kinésica Médica (4), Clínica Kinésica Quirúrgica (4), Prácticas Profesionales Intensivas (5) |

La carrera de Kinesiología no existía en el seed y se agregó a UNNE con su nombre oficial.

La de Veterinaria se llamaba `Veterinaria` y se renombró a su nombre oficial con la migración `RenombrarCarreraMedicinaVeterinaria`: un `UPDATE` sobre la fila existente, acotado a UNNE, que corre antes que el seed. No alcanzaba con cambiar el string del seed: el seed es idempotente **por nombre**, y habría creado una segunda carrera con el catálogo y las materias enganchados, dejando la vieja con los `EstudianteCarrera` verificados. Esos estudiantes se habrían quedado sin poder publicar, sin ningún error visible. Al renombrar, `carrera_id` no cambia y todo lo que la referencia sigue en su lugar.

Los nombres de las entradas del catálogo, como "Aplicación de vacunas (Veterinaria)", **no** se tocaron: también son claves de idempotencia del seed, y cambiarlos duplicaría el catálogo.

Los planes cambian por cohorte: la FCV implementa un [Plan 2027](https://vet.unne.edu.ar/innovacion-y-futuro-la-facultad-de-ciencias-veterinarias-de-la-unne-presento-el-nuevo-plan-de-estudios-2027/) de forma gradual, y la página de correlativas de FOUNNE todavía usa la nomenclatura anterior. El seed refleja lo vigente a octubre de 2026.

## Tests

`tests/Lex.Api.Tests` (xUnit + Testcontainers + `WebApplicationFactory<Program>`) contra un `postgres:16` efímero. La API arranca como en producción, con migraciones y seed, y los escenarios se arman por los mismos endpoints que usa el frontend, incluida la bandeja de verificación.

El proyecto vive **fuera de `backend/`** porque `Lex.Api.csproj` (SDK Web) compila todos los `.cs` debajo de su carpeta: un proyecto de tests adentro terminaría compilado dentro de la API.

Cobertura:
- **Habilitación:** carrera pendiente, año insuficiente, materia de otra carrera, fecha pasada, solape, y aprobar desde `Rechazado`.
- **Cupo único:** incluye inscripciones **simultáneas**, que solo frena el índice parcial.
- **Paciente:** tipo y pertenencia.
- **Constancia:** emisión en `Asistio` y en `NoAsistio`, antes del inicio, doble registro, `asistio` ausente, y verificación pública sin datos del paciente.
- **Renombre de Medicina Veterinaria:** con un contenedor propio, una base parada en la migración anterior con "Veterinaria" (y una homónima en otra institución) y un estudiante verificado. Se comprueba que el `Up` renombra solo la de UNNE conservando el id y el vínculo, que el `Down` revierte, y que el seed posterior no duplica.

```bash
dotnet test tests/Lex.Api.Tests   # necesita Docker
```

Corren en GitHub Actions en cada push y PR que toque `backend/` o `tests/` (`.github/workflows/backend-tests.yml`). **En una máquina sin Docker no corren**: fallan al levantar el contenedor, no por el código.

## Limitaciones conocidas

- **Sin validación cruzada contra la agenda del marketplace.** Una práctica y un `Turno` pago del mismo estudiante pueden solaparse. El solape solo se chequea entre prácticas. Cruzarlos acoplaría este módulo con `TurnoService`, que está fuera de alcance.
- **Publicaciones simultáneas del mismo estudiante.** El chequeo de solape es del service, sin bloqueo, así que dos requests al mismo tiempo podrían crear dos prácticas pisadas. El riesgo es bajo (es un único usuario). Cerrarlo del todo requiere un `EXCLUDE USING gist` con `btree_gist`.
- **Una `Cubierta` vencida sin asistencia registrada queda así para siempre.** No hay cierre automático ni recordatorio al estudiante.
- **Re-verificación sin re-envío.** El admin puede aprobar un vínculo rechazado, pero la app no tiene cómo subir un comprobante nuevo: llega por fuera.
- **Cupo de un paciente por práctica.**
- **El tipo de paciente no se valida contra la carrera.** Una práctica de Medicina Veterinaria con paciente humano es técnicamente publicable; lo decide el estudiante.
- **`AnioCursado` es uno solo por estudiante, no por carrera** (heredado de `PerfilEstudiante`). Alguien con dos carreras en años distintos se evalúa con el mismo año para las dos.
- **El rol Estudiante entra en el JWT recién después de re-loguear** (heredado de `activar-estudiante`).
- **Constancia sin PDF.** Alcanza con el registro y su código verificable.
- **Sin rate limit en la verificación pública.** Con 40 bits de código, enumerar no es práctico, pero no hay freno explícito.
- **`DemoService.reset`**: borra las prácticas de estudiantes demo enteras. De una práctica de un estudiante real borra solo la inscripción demo; si la práctica seguía `Cubierta` por esa inscripción, vuelve a `Publicada`, y su constancia (si existía) se conserva porque es un snapshot.

Ver `README_CATALOGO.md` para la habilitación por carrera y `README_TURNOS.md` para la zona horaria.
