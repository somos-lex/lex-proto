# Modelo de Pagos en LEX

## Estructura

- **Pago**: contrato de pago de un Trabajo. Relación 1-a-1 con Trabajo (índice UNIQUE en `pago.trabajo_id`). Guarda los montos snapshoteados al momento de contratar.
- **MovimientoPago**: cada operación contable individual. Relación N-a-1 con Pago. El monto es siempre positivo; el signo lo deriva el tipo de asiento.

El `Pago` dice *cuánto* y *en qué estado está*; el libro de `MovimientoPago` dice *qué pasó y cuándo*. Los asientos son inmutables: una corrección se hace con un asiento nuevo, no editando uno viejo.

## Ciclo de vida

1. **Contratación**: se crea `Pago(Retenido)` + `MovimientoPago(Retencion, monto_total)`.
2. **Completado**: se crean `MovimientoPago(LiberacionEstudiante, monto_a_estudiante)` + `MovimientoPago(ComisionLex, monto_comision)` → `Pago(Liberado)`.
3. **Cancelado**: si el escrow seguía sin resolverse, se crea `MovimientoPago(Reembolso, monto_total)` → `Pago(Reembolsado)`.
4. **Disputa**: `Pago(EnDisputa)`. Sin movimiento contable: la plata no se mueve, solo queda congelada hasta la resolución.

Liberar y reembolsar aceptan un pago en `Retenido` **o** en `EnDisputa`, porque la máquina de estados habilita `Disputa → Completado` y `Disputa → Cancelado`: resolver una disputa tiene que poder cerrar el escrow.

### Atomicidad

Los métodos de negocio de `PagoService` no llaman a `SaveChanges` ni abren transacción propia: solo dejan los cambios en el `DbContext`. El llamador (contratación o máquina de estados) cierra la unidad de trabajo con un único `SaveChanges`, así el trabajo y su pago se commitean en la misma transacción implícita, o no se commitea ninguno.

## Comisión LEX

- Configurable en `appsettings.json` como `Lex:PorcentajeComision` (default 10).
- Se snapshotea al momento de contratar en `pago.porcentaje_comision_lex`: un cambio futuro del take rate no reescribe los pagos ya firmados.
- Se calcula sobre `MontoTotal` y se descuenta del monto que se libera al estudiante.

Ejemplo con trabajo de $10.000 y comisión 10%:

- Cliente paga: $10.000
- Estudiante recibe: $9.000
- LEX se queda con: $1.000

## Estado actual

- Contabilidad interna funcional.
- **NO integrado con Mercado Pago** aún. La contabilidad refleja la intención de pago, no un cobro real.
- Liberación **total** al completar el trabajo. La liberación **fraccionada por sesión** (para paquetes de Clase/Salud) queda para Hito 2, cuando existan sesiones.

## Reservado para futuro

- `EstadoPago.ParcialmenteLiberado`: cuando existan paquetes con sesiones múltiples (Hito 2).
- `MovimientoPago.ReferenciaExterna`: para guardar el `payment_id` de Mercado Pago (fase futura).
- `TipoMovimientoPago.Ajuste`: para correcciones manuales del admin (interfaz admin pendiente).
- `MovimientoPago.TrabajoHistorialId`: traza opcional del asiento a la transición de estado que lo originó.

## Endpoints

| Endpoint | Acceso | Devuelve |
|---|---|---|
| `GET /api/pagos/mios` | usuario logueado | Pagos donde participa (como cliente o estudiante), del más nuevo al más viejo. Filtros opcionales: `?estado=` y `?tipo_trabajo=`. |
| `GET /api/pagos/{id}` | partes del trabajo | Detalle del pago con su libro de movimientos. |
| `GET /api/pagos/{id}/movimientos` | partes del trabajo | Solo el libro, en orden cronológico. |
| `GET /api/admin/ingresos` | rol Admin | Panel de ingresos con breakdown por vertical. |

Un pago al que el usuario no participa responde **404**, igual que uno inexistente: distinguirlos con un 403 filtraría que el pago existe.

Ver `README_ESTADOS_TRABAJO.md` para el efecto de cada transición sobre el pago.
