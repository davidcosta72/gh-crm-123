# README.handoff — CRM-123

Entrega de diseño lista para que Claude Code Web continúe el desarrollo. Todo lo visual está resuelto; lo que falta es conectar datos reales. La estructura de base de datos vinculante es `uploads/SCRIPTS-SQL.md` (nombres de tabla y columna usados aquí son los de ese documento, sin excepción).

---

## 1. Pantallas construidas y archivos exactos

Tres archivos en la raíz del proyecto. Cada uno es un Design Component autocontenido (`.dc.html`): plantilla + clase `Component`, sin dependencias fuera del sistema de diseño.

### `CRM-123 Ventas.dc.html` — app de escritorio del vendedor

Una sola vista raíz con conmutación por `state.view`. Valores de `view` y su pantalla:

| `state.view` | Pantalla | Contenido |
|---|---|---|
| `login` | Acceso | Botón Google, estado de error "Acceso no autorizado" |
| `tablero` | Tablero del día | Tareas de hoy + vencidas, oportunidades sin actividad reciente |
| `opps` | Oportunidades (lista) | Filtros por etapa, tabla con valor y última actividad |
| `oppDetail` | Oportunidad (detalle) | Cambio de etapa, datos, historial, tareas ligadas |
| `clients` | Clientes (lista) | Búsqueda, tabla, alta |
| `clientDetail` | Cliente (ficha) | Ficha, notas, oportunidades del cliente |
| `tasks` | Tareas | Filtro Pendientes / Completadas |

Diálogos, por `state.dialog`: `loss` (motivo de pérdida), `task` (nueva tarea), `client` (nuevo cliente), `opp` (nueva oportunidad).

### `CRM-123 Supervisor.dc.html` — PWA del supervisor

| `state.view` | Pantalla | Contenido |
|---|---|---|
| `login` | Acceso | Igual que Ventas, acento sage |
| `panel` | Panel del equipo | Pipeline por etapa, tareas pendientes por vendedor, ganadas del mes |
| `seller` | Detalle de vendedor | Sus oportunidades (solo lectura + reasignar), tareas, historial |
| `users` | Gestión de usuarios | 12 perfiles, alta, desactivar / reactivar |
| `resumen` | Resumen matutino | Hora programada, envío manual, log de envíos |

Diálogos: `reassign`, `user`, `off`.

Tweak declarado (`data-props`): `mostrarDueno` (boolean, default `true`) — muestra u oculta la columna **Vendedor** en la tabla de oportunidades del detalle de vendedor.

### `CRM-123 Estados.dc.html` — tablero de estados transversales

Plantilla sin lógica, en modo lienzo (`design_doc_mode: canvas`). Dos secciones, Ventas y Supervisor, con los estados: vacío de tablero, esqueleto de carga, error con reintento, proceso en ejecución (botón bloqueado + spinner), validación de motivo de pérdida, clientes vacío, oportunidad sin historial, login no autorizado; y en Supervisor: panel vacío, esqueleto de panel, error de panel, envío del resumen (enviando / correcto / fallido), confirmación de baja, reasignación confirmada. Es referencia visual, no código a portar tal cual.

---

## 2. Valores visuales finales

Todo sale de los tokens de Organic (`_ds/organic-616f3116-4d15-4371-a357-18fd50e77f3f/styles.css`). No hay hex escritos a mano en Ventas; en Supervisor sí, y solo para redefinir la rampa de acento (ver abajo). **Usa las variables CSS, no estos hex, salvo en el override del Supervisor.**

### Color — base (Ventas y ambos logins)

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#f5ead8` | Fondo de página |
| `--color-surface` | ver `styles.css` | Barra lateral, tarjetas, tablas |
| `--color-text` | `#201e1d` | Texto |
| `--color-accent` | `#c67139` | Acento terracota: nav activa, píldoras activas, botón primario |
| `--color-accent-2` | `#7a8a5e` | Segundo acento sage: etiquetas de etapa ganada, tipo "Reunión" |
| `--color-accent-100 … -900` | rampa | `100`/`200` fondos tintados, `700`/`800` texto sobre tintado |
| `--color-neutral-100 … -400` | rampa | Tarjeta de usuario, barras de pipeline, esqueletos |
| `--color-divider` | ver `styles.css` | Borde de píldoras inactivas, cabecera sticky |

### Color — override del Supervisor

`CRM-123 Supervisor.dc.html` redefine en su `<helmet>` las rampas `--color-accent-*` y `--color-accent-2-*` para invertir las dos voces de Organic: **sage como acento primario, terracota como segundo**. Esto distingue la app del supervisor de la del vendedor de un vistazo. Los hex son los de las rampas oficiales de Organic, intercambiadas:

```
--color-accent: #7a8a5e   (sage)      --color-accent-2: #c67139  (terracota)
--color-accent-100 #f0fae1  -200 #e1eecc  -300 #ccdbb2  -400 #aebf92
              -500 #8fa073  -600 #728157  -700 #56633f  -800 #3d472b  -900 #272e1b
--color-accent-2-100 #fff2eb  -200 #ffe1d0  -300 #ffc6a5  -400 #f6a06b
                -500 #d67f48  -600 #b2622d  -700 #8c491a  -800 #643312  -900 #402310
```

Si el producto final debe compartir un único tema, elimina ese bloque `:root` y distingue las apps por otra vía (marca en la cabecera).

### Tipografía

- Display: **Caprasimo** (`--font-heading`) — títulos `h2`–`h6`, cifras grandes.
- Texto: **Figtree** (`--font-body`) — todo lo demás.
- Tamaños en uso: 42px cifra de pipeline · 32px cifra de pendientes por vendedor · 25px valor de oportunidad · 20px títulos de estado vacío · 17px título de tarjeta · 16px botón primario de login · 15px nav · 14px cuerpo y celdas · 13px meta y píldoras · 12px kickers, badges y `card-kicker` · 11px badge de nav.
- Nunca por debajo de 11px, y ningún control interactivo por debajo de 44px de alto en el login ni en la PWA.
- `font-variant-numeric: tabular-nums` + `white-space: nowrap` en toda columna de importe, teléfono o conteo.

### Espaciado, radios, sombras

- Espaciado: solo `var(--space-2|3|4|6|8)` (escala de Organic, densidad 1.10×). `gap` en flex/grid, nunca márgenes sueltos entre hermanos.
- Radios: `var(--radius-md)` en avisos tintados, `var(--radius-lg)` en tarjetas, `calc(var(--radius-lg) * 1.15)` en la barra lateral y los marcos del tablero de estados, `999px` en botones, inputs, píldoras, badges y barras de pipeline.
- Sombras: `elev-sm` en tarjetas destacadas, `--shadow-lg` en diálogos. Sin sombras ad-hoc.
- Anchos de contenido: `max-width: 1080px` en Ventas, `980px` en Supervisor, `640px` en Resumen matutino.

### Animaciones

Dos keyframes, ambas solo en el tablero de estados: `crmpulse` (1.4s, esqueletos) y `crmspin` (0.8s, spinner de proceso). Reprodúcelas igual si implementas estados de carga.

---

## 3. Componentes del sistema de diseño usados

**No se usó shadcn/ui.** Todo procede de Organic vía `styles.css` + `_ds_bundle.js`, cargados en el `<helmet>` de cada DC. No reescribas estos componentes:

| Clase de Organic | Dónde |
|---|---|
| `.btn` `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-block` | Todas las acciones; `btn-block` en el login |
| `.tag` `.tag-accent` `.tag-accent-2` `.tag-neutral` `.tag-outline` | Etapas, tipos de tarea, roles, estado activo, vencidas |
| `.card` `.card-kicker` `.card-title` `.card-meta` `.elev-sm` | Tarjetas, filas de tarea, paneles de datos |
| `.table` | Oportunidades, clientes, usuarios, ranking, log de envíos |
| `.field` + `label`, `.input`, `.seg` + `.seg-opt` | Todos los formularios y diálogos; `.seg` para tipo de tarea y rol |
| `.dialog-backdrop` `.dialog` `.dialog-title` `.dialog-body` `.dialog-actions` | Los siete diálogos |
| `.text-muted` | Texto secundario |

Hover, pressed, `:focus-visible` y disabled vienen del sistema; no los redefinas por pantalla. Estilos locales (inline) se usan solo para layout, píldoras de filtro y navegación —patrones que Organic no cubre como clase— y están definidos como constantes al principio de cada clase `Component`: `PILL`, `PILL_ON`, `NAV`, `NAV_ON`, `BADGE`, `BADGE_ON`.

Iconografía: Lucide, stroke-width 2.75, según Organic. **No se colocó ningún icono en estas pantallas**; donde un estado vacío o un aviso lleva un círculo de color plano, ahí va el icono de Lucide correspondiente.

---

## 4. Desviaciones respecto al brief

1. **Supervisor con rampa de acento invertida.** El brief no pide dos temas. Se hizo para que el supervisor sepa en qué app está sin leer la cabecera. Reversible borrando un bloque `:root` (§2).
2. **Ranking limitado a 6 vendedores.** El brief pide "ganadas del mes"; con 9 vendedores activos la tabla dominaba el panel. Se recorta a los 6 primeros. Cambiar el `.slice(0, 6)` en `renderVals()` si debe verse el equipo completo.
3. **Sin marco de móvil en la PWA del supervisor.** Decisión del usuario en el formulario inicial. La cabecera es sticky y el layout responde por `flex-wrap` y `minmax()`, así que funciona a ancho de móvil sin el marco.
4. **Densidad "con aire" en lugar de compacta.** El brief describe un escritorio operativo y denso; el usuario eligió fidelidad a Organic. Las filas usan `var(--space-3) var(--space-4)` de padding. Para más densidad baja a `var(--space-2) var(--space-3)` y el cuerpo a 13px.
5. **Fecha de vencimiento fusionada en la línea de contexto.** En las filas de tarea, la fecha va junto a la oportunidad en el subtítulo, no en columna propia: en una sola columna la descripción se rompía en dos líneas. Las vencidas conservan etiqueta destacada junto a la hora.
6. **Ranking de ganadas calculado sobre los datos, no fijado.** Un primer borrador llevaba conteos mensuales estáticos; se eliminaron para que conteo e importe salgan del mismo conjunto de `opportunities` con `stage = 'ganada'`. Al conectar la BD, filtra por mes natural.
7. **"Última actividad" mostrada como texto relativo** ("Ayer", "Hace 11 días") porque es lo que se lee de un vistazo. Calcúlalo desde `activity_log.created_at` o `opportunities.updated_at`, no lo guardes.

---

## 5. Qué es maqueta y qué falta conectar

Todo el estado vive en memoria en la clase `Component`; **no hay red, ni Supabase, ni persistencia**. Al recargar se vuelve al login.

### Datos de ejemplo embebidos (hay que sustituirlos por consultas)

Constantes al principio de cada clase lógica. En Ventas: `CLIENTS`, `OPPS`, `TASKS`, `ACTIVITIES`. En Supervisor: `PROFILES`, `CLIENT_NAME`, `OPPS`, `TASKS`, `ACTIVITIES`, `SEND_LOG`. Los campos replican las columnas de `SCRIPTS-SQL.md` (`clients.company_name`, `clients.phone`, `opportunities.stage`, `opportunities.amount_eur`, `opportunities.source`, `opportunities.loss_reason`, `tasks.type`, `tasks.status`, `tasks.due_date`, `tasks.due_time`, `tasks.completed_at`, `activity_log.event_type`, `profiles.full_name`, `profiles.role`, `profiles.active`), con `id` cortos legibles (`c1`, `o3`, `p7`) en lugar de UUID.

### Funciona en la maqueta pero sin backend

- Login: `login()` conmuta la vista. Falta OAuth de Google y la comprobación de `profiles.active`. El estado de error se fuerza con el botón "Ver estado de error", que **debe eliminarse** al conectar.
- Completar tarea: marca `status = 'completada'`, pone `completed_at` y escribe una entrada en el historial local. Falta el `UPDATE` y el `INSERT` en `activity_log`.
- Cambio de etapa: escribe en el historial; `perdida` abre diálogo y exige `loss_reason` no vacío. La validación es correcta, la escritura no existe.
- Altas (cliente, oportunidad, tarea, usuario), reasignación y desactivación: validan campos obligatorios, muestran "Guardando…" con `setTimeout(700)` y actualizan el estado local. Sustituye cada `finish()` por la mutación real y su manejo de error.
- Envío del resumen matutino: `setTimeout(900)` y una entrada en el log. Falta el disparo real y el cron de las 07:00 Europe/Madrid.
- Reasignación: cambia `opportunities.owner_id` en memoria y registra `opportunity_reassigned`. Falta comprobar permiso de supervisor en servidor.

### No implementado en absoluto

- Estados de carga y de error de red. Están diseñados en `CRM-123 Estados.dc.html` pero ninguna app los muestra: no hay peticiones que fallar. Al conectar, cada lista necesita esqueleto, error con reintento y vacío.
- Paginación y ordenación de tablas. Las listas son cortas; con volumen real hacen falta ambas y probablemente paginación por cursor.
- La búsqueda de clientes filtra en memoria sobre empresa, contacto y teléfono. Debe ir a servidor.
- Detalle de vendedor: es solo lectura por diseño, salvo reasignar. Las restricciones por rol deben imponerse con RLS, no en el cliente.
- Ningún dato deriva del usuario autenticado: "Elena Prados" y "Carmen Ibáñez" están escritos en la plantilla y en los datos de ejemplo.
- Iconos (§3), notificaciones, manifest y service worker de la PWA.
