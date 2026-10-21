# Smoke test manual — Banco de Turnos

Recorrido por pantalla, contra la app **desplegada**, para correr antes de mostrarla a nadie. Sigue el mismo camino que el test automatizado `tests/Lex.Api.Tests/Practicas/CaminoVerificacionE2ETests.cs` y agrega lo que ese test no puede ver: el frontend.

El test cubre la API en CI. Esto cubre lo que se ve en la demo.

Tiempo estimado: **40 minutos**, incluidos unos 15 de espera en el paso 19.

> **No uses las cuentas demo en ningún paso.** Ni `@demo.com`, ni las del seed (`@seed.lex`). Todos sus estudiantes vienen verificados desde el seed, y ese atajo es justamente el que escondía que no había forma de verificar a un estudiante real. Este ensayo tiene que arrancar con un estudiante **en Pendiente**.

---

## Preparación

| Qué | Detalle |
|---|---|
| URL | La del frontend en Vercel. Todas las rutas de abajo son relativas a ella. |
| Casilla A (estudiante) | Una casilla de correo real y disponible. Usá un sufijo para encontrarla al limpiar: `tunombre+lexsmoke-est@gmail.com`. |
| Casilla B (cliente) | Otra casilla real y disponible, con el mismo sufijo: `otronombre+lexsmoke-cli@gmail.com`. |
| Cuenta Admin | La del entorno desplegado (`Lex:AdminEmail` / `Lex:AdminPassword` en Render). |
| Comprobante | Un PDF o imagen cualquiera subido a Google Drive, con acceso **"Cualquier persona con el vínculo"**. Copiá ese link. **No uses la constancia real de otra persona.** |
| Navegadores | Tres perfiles separados, porque la sesión vive en cookies: **Perfil 1** para el estudiante, **Perfil 2** para el cliente, **Perfil 3** para el admin. Más una **ventana de incógnito** para el visitante anónimo. |
| Pantalla | Ventana de escritorio: en mobile los ítems del Navbar están ocultos. |

**Opcional (recomendado).** En el SQL editor de Supabase, anotá estos conteos antes de empezar. Al final tienen que dar lo mismo, porque el módulo no toca dinero:

```sql
SELECT (SELECT count(*) FROM pago)            AS pago,
       (SELECT count(*) FROM movimiento_pago) AS movimiento_pago,
       (SELECT count(*) FROM trabajo)         AS trabajo,
       (SELECT count(*) FROM sesion)          AS sesion,
       (SELECT count(*) FROM turno)           AS turno;
```

---

## Recorrido

### A. El estudiante se registra y queda Pendiente — Perfil 1

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 1 | `/registro` | Pestaña **Cliente** → **Particular**. Nombre "Prueba Smoke Estudiante", email de la casilla A, contraseña. Enviar. | Te lleva a `/` con la sesión iniciada ("Hola, Prueba Smoke Estudiante"). | ☐ |
| 2 | Navbar | Mirar los ítems. | Vista Cliente: **Explorar servicios · Mis trabajos · Mis pacientes · Prácticas clínicas · Mis inscripciones**, y el botón **"¿Sos estudiante? Ofrecé tus servicios"**. **No** aparece "Mis prácticas". | ☐ |
| 3 | Modal de activación | **Sin recargar la página**, click en "¿Sos estudiante?". Carrera **Odontología**, año **4º**, el link del comprobante y una bio. **Activar perfil**. | El modal se cierra y quedás en vista Estudiante. Navbar: **Mis servicios · Disponibilidad · Mis trabajos · Mis prácticas**, más el selector **"Vista:"**. | ☐ |
| 3b | | Si en cambio aparece "¡Perfil de estudiante activado! … volvé a iniciar sesión": | La activación quedó hecha, pero se había recargado la página entre el registro y la activación. Re-loguear y seguir. **No es un fallo**, aunque en la demo conviene evitarlo. | ☐ |
| 4 | `/panel/practicas` | Click en **Publicar práctica**. | El modal **no muestra selector de materias**. Muestra el aviso ámbar **"Todavía no podés publicar prácticas"**, que menciona la verificación pendiente. Cerrar el modal. **No recargues ni cierres sesión** en este perfil hasta el paso 8. | ☐ |

### B. El admin verifica — Perfil 3

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 5 | `/login` → `/panel/admin` | Entrar con la cuenta Admin y escribir `/panel/admin` en la barra de direcciones. El Navbar no tiene ítems para Admin. | Panel de ingresos, con el botón **"Verificaciones pendientes →"** arriba a la derecha. | ☐ |
| 6 | `/panel/admin/verificaciones` | Click en "Verificaciones pendientes". | Aparece una tarjeta con **Prueba Smoke Estudiante**, su email y **"Odontología · Universidad Nacional del Nordeste (UNNE) · 4° año"**. | ☐ |
| 6b | Misma tarjeta | Click en **"Abrir comprobante (drive.google.com) ↗"**. | Se abre en una pestaña nueva y el documento **se lee**: no pide permiso, no da error. Si muestra "Solicitar acceso", el link no es público: corregilo antes de seguir. | ☐ |
| 7 | Misma tarjeta | **Aprobar** → observación "Comprobante revisado (smoke)" → **Confirmar aprobación**. | La tarjeta desaparece. Recargar la página: sigue sin aparecer. Con comprobante cargado, la etiqueta dice **"Observaciones (opcional)"**. Sin comprobante diría **"¿Cómo verificaste el vínculo? (obligatorio: no hay comprobante)"** y no dejaría aprobar en blanco; ese camino lo cubre el test automatizado. | ☐ |

### C. El estudiante publica — Perfil 1, sin recargar ni re-loguear

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 8 | `/panel/practicas` | Volver a abrir **Publicar práctica**, **sin recargar la página ni volver a iniciar sesión**. | Ahora el selector **está poblado**. Lista **Práctica Clínica Preventiva (3° año), Clínica Rehabilitadora (4°) y Periodoncia (4°)**, todas de Odontología. **No** aparecen Clínica Integral Adulto ni Clínica en Odontopediatría (5°), ni materias de otras carreras. | ☐ |
| 9 | Modal de publicación | **Práctica P1**: Periodoncia, fecha **hoy**, hora **dentro de 15 minutos** (hora de Argentina), 60 min, paciente **Humano**, lugar "Clínica FOUNNE, box 3 (smoke)", requisitos **"Traer DNI y estudios previos (smoke)"**. Publicar. | P1 aparece en **"Buscando paciente"** con el badge azul y la fecha y hora en hora argentina. Anotá la hora de inicio. | ☐ |
| 10 | Modal de publicación | **Práctica P2**: Periodoncia, fecha **mañana**, 10:00, 60 min, Humano, requisitos "Ayuno de 2 horas (smoke)". Publicar. | P2 también aparece en "Buscando paciente". | ☐ |

### D. Lo que ve un visitante — incógnito

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 11 | Navbar y `/practicas` | Abrir la URL sin sesión. | Navbar: **Prácticas clínicas · Iniciar sesión · Crear cuenta**. En `/practicas` aparecen P1 y P2 con **"Paciente humano"** y **"Sin costo"**. Con el filtro Carrera Odontología + Paciente Humano siguen apareciendo; con Paciente **Animal**, desaparecen. | ☐ |
| 12 | Detalle de P1 | Click en P1. **Sin iniciar sesión.** | El recuadro ámbar **"Requisitos previos"** con "Traer DNI y estudios previos (smoke)" se ve **antes de cualquier acción**, sin cuenta. El panel lateral dice **"Inscribite sin costo"** y pide iniciar sesión. Copiá la URL de P1. | ☐ |

### E. El cliente se inscribe — Perfil 2

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 13 | `/registro` | Cliente → Particular, nombre "Prueba Smoke Cliente", email de la casilla B. | Sesión iniciada. Navbar de Cliente con **Prácticas clínicas** y **Mis inscripciones**. **No** aparece "Mis prácticas". | ☐ |
| 14 | `/panel/pacientes` | Agregar dos pacientes: **Humano** "Paciente Smoke Humano" y **Animal** "Firulais Smoke" (especie Perro). | Los dos aparecen en la lista. | ☐ |
| 15 | `/practicas` → P1 | En el panel de inscripción, abrir el selector de paciente. | Solo aparece **Paciente Smoke Humano**. Firulais **no** se ofrece: es el rechazo del tipo equivocado, visto desde la UI. Los requisitos se vuelven a mostrar junto a la casilla de aceptación. **"Confirmar inscripción"** queda deshabilitado hasta elegir paciente **y** tildar la casilla. | ☐ |
| 15b | | Elegir el paciente humano, tildar la casilla, **Confirmar inscripción**. | Te lleva a `/panel/inscripciones`. P1 figura con el badge **"Inscripta"** y los requisitos que aceptaste. | ☐ |

### F. Cupo único — incógnito

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 16 | `/practicas` | Recargar. | P1 **ya no aparece**; P2 sigue. | ☐ |
| 16b | URL de P1 | Pegar la URL copiada en el paso 12. | Página **no encontrada**. Para quien no participa, una práctica tomada no existe. El rechazo de la API a una segunda inscripción (400 y no 500) lo cubre el test automatizado. | ☐ |

### G. El estudiante ve al paciente y registra la asistencia — Perfil 1

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 17 | `/panel/practicas` | Recargar. | P1 está en **"Con paciente inscripto"**, con "Paciente: Paciente Smoke Humano · Inscripto por Prueba Smoke Cliente". **"Registrar asistencia" está deshabilitado** y debajo se lee *"La asistencia se registra a partir del horario de inicio…"*. | ☐ |
| 18 | `/practicas/{id de P2}` | Abrir el detalle de P2 desde la URL o desde el link del título en el panel. | El panel lateral dice **"Es tu práctica"**: el estudiante no puede inscribirse en su propia práctica. | ☐ |
| 19 | `/panel/practicas` | Volver y **esperar a la hora de inicio de P1, sin recargar**. | Dentro de los 30 segundos posteriores a la hora de inicio, el botón **"Registrar asistencia" se habilita solo**. | ☐ |
| 19b | | Registrar asistencia → **"El paciente asistió"**. | P1 pasa a **"Realizadas"**. **Ver constancia** abre un modal con el código **`LEX-XXXX-XXXX`**, "El paciente asistió", estudiante, Periodoncia, Odontología, UNNE, fecha y paciente. Copiá el código. | ☐ |

### H. La cátedra verifica la constancia — incógnito

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 20 | `/constancias` | Pegar el código y **Verificar**. | **"✓ Constancia auténtica emitida por LEX"** con estudiante, materia, carrera, institución, fecha de la práctica y fecha de emisión. **No aparece ningún dato del paciente**, ni siquiera el nombre. Buscá "Paciente Smoke" en la página con Ctrl+F: no tiene que haber coincidencias. | ☐ |
| 20b | `/constancias` | Pegar el mismo código **en minúsculas**. | Encuentra la misma constancia. | ☐ |
| 20c | `/constancias` | Probar con `LEX-0000-0000`. | "No encontramos ninguna constancia con ese código." | ☐ |

### I. Cancelar una inscripción — Perfil 2

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 21 | `/panel/inscripciones` | Mirar P1. | Badge **"Asistió"** y botón **Ver constancia**, que abre la misma constancia del paso 19b. | ☐ |
| 22 | `/practicas` → P2 | Inscribir a Paciente Smoke Humano en P2. Después, en `/panel/inscripciones`, **Cancelar inscripción** → **Confirmar cancelación**. | La inscripción a P2 queda **"Cancelada"**. En incógnito, `/practicas` vuelve a mostrar P2. En Perfil 1, P2 vuelve a "Buscando paciente". | ☐ |

### J. Nada de dinero

| # | Pantalla | Qué hacer | Resultado esperado | ✓ |
|---|---|---|---|---|
| 23 | Supabase SQL editor | Volver a correr la consulta de la preparación. | Los cinco conteos son **iguales** a los de antes. | ☐ |

Si algún paso falla, anotá el número, la pantalla y lo que se vio, y **no muestres la app hasta corregirlo**. Para cada error del frontend, conviene mirar también la pestaña Network: un 500 nunca es un resultado esperado.

---

## Limpieza después del ensayo

Que nada del ensayo aparezca en la demo.

- [ ] **Perfil 1 (estudiante)**: en `/panel/practicas`, **Cancelar práctica** en P2 y en cualquier otra que siga en "Buscando paciente" o "Con paciente inscripto". Las realizadas no aparecen en el listado público, pero se borran abajo.
- [ ] **Incógnito**: `/practicas` no muestra ninguna práctica "(smoke)".
- [ ] **Perfil 3 (admin)**: `/panel/admin/verificaciones` no tiene tarjetas del ensayo.
- [ ] **Cuentas y datos**: la app no tiene forma de borrar usuarios, prácticas ni pacientes, así que se borran en el SQL editor de Supabase. Primero corré **solo la vista previa** y confirmá que lista **exactamente** las dos cuentas del ensayo:

  ```sql
  SELECT usuario_id, email FROM usuario WHERE email ILIKE '%+lexsmoke%';
  ```

  Si lista solo esas dos, corré el borrado. Va en orden de FKs, hijos antes que padres, y en una transacción:

  ```sql
  BEGIN;

  CREATE TEMP TABLE smoke_usuarios ON COMMIT DROP AS
    SELECT usuario_id FROM usuario WHERE email ILIKE '%+lexsmoke%';
  CREATE TEMP TABLE smoke_practicas ON COMMIT DROP AS
    SELECT id FROM practica_clinica WHERE estudiante_id IN (SELECT usuario_id FROM smoke_usuarios);

  DELETE FROM constancia_practica  WHERE practica_clinica_id IN (SELECT id FROM smoke_practicas);
  DELETE FROM inscripcion_practica WHERE practica_clinica_id IN (SELECT id FROM smoke_practicas)
                                      OR cliente_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM practica_clinica     WHERE id IN (SELECT id FROM smoke_practicas);
  DELETE FROM paciente             WHERE cliente_responsable_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM disponibilidad_estudiante WHERE estudiante_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM estudiante_carrera   WHERE estudiante_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM perfil_estudiante    WHERE usuario_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM datos_particular     WHERE usuario_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM perfil_cliente       WHERE usuario_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM usuario_rol          WHERE usuario_id IN (SELECT usuario_id FROM smoke_usuarios);
  DELETE FROM usuario              WHERE usuario_id IN (SELECT usuario_id FROM smoke_usuarios);

  COMMIT;
  ```

  Supone que el ensayo **solo** se inscribió en sus propias prácticas P1 y P2. Si el cliente del ensayo se inscribió en la práctica de un estudiante real, esa práctica quedaría "Con paciente inscripto" sin inscripción: cancelá esa inscripción desde la UI **antes** de borrar.
- [ ] **Verificación final**: `SELECT count(*) FROM usuario WHERE email ILIKE '%+lexsmoke%';` da `0`.
- [ ] **Drive**: borrá el archivo del comprobante o quitale el acceso público.
- [ ] **Navegadores**: cerrá sesión en los tres perfiles, para no arrancar la demo logueado como una cuenta borrada.
