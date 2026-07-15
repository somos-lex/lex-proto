# Estados de Trabajo por vertical

## Comunes a todos los verticales

- **Pendiente**: recién contratado, esperando aceptación del estudiante.
- **Aceptado**: estudiante confirmó. Aún no arrancó el trabajo.
- **Cancelado**: alguna de las partes canceló antes de completar. Puede requerir reembolso.
- **Disputa**: conflicto no resuelto. Requiere intervención de admin.

## Por vertical

### ProyectoCerrado

- **EnCurso**: estudiante trabajando activamente.
- **Entregado**: estudiante subió entregables y notificó. Cliente debe revisar.
- **Completado**: cliente aprobó. Pago liberado al estudiante.

### Clase

- **EnCurso**: al menos una sesión programada o realizada. Pueden quedar sesiones pendientes.
- **Entregado**: todas las sesiones del paquete fueron realizadas.
- **Completado**: cliente confirmó satisfacción. Pago total liberado.

Nota: en paquetes, cada sesión libera una fracción del pago (Sub-hito 1.3). Este flujo NO cambia el estado global hasta que se completen todas.

### Salud

- **EnCurso**: consentimiento firmado, práctica en ejecución.
- **Entregado**: práctica realizada, historial actualizado.
- **Completado**: cliente confirmó. Pago liberado.

**Importante**: Salud NO puede pasar de `Aceptado` a `EnCurso` sin consentimiento firmado.

## State machine

```
Pendiente → Aceptado, Cancelado
Aceptado → EnCurso, Cancelado
EnCurso → Entregado, Disputa, Cancelado
Entregado → Completado, Disputa
Disputa → Completado, Cancelado
Completado → (final)
Cancelado → (final)
```

Cualquier transición no listada por la state machine se rechaza con HTTP 400.

## Permisos por transición

| Transición | Actor permitido |
|---|---|
| aceptar | estudiante |
| iniciar | estudiante |
| entregar | estudiante |
| completar | cliente |
| cancelar | cliente o estudiante |
| disputar | cliente o estudiante |
