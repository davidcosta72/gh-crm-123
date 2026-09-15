# BUILD_PLAN.md — CRM-123

Plan de 4 hitos. El Hito 1 lo ejecuta **Claude.ai Chat** (con el conector MCP de Supabase) en una conversación aparte. Los Hitos 2 a 4 los ejecuta **Claude Code Web**, que no puede avanzar al hito siguiente sin confirmación explícita del humano.

---

## Hito 1 — Base de datos

**Ejecutor:** Claude.ai Chat, con el conector MCP de Supabase (se proporciona al iniciar este hito en una conversación aparte).

**Qué construye:** únicamente el script de base de datos. Nada de interfaz.

**Insumos que debe tomar en cuenta:** `CLAUDE.md`, `TECHNICAL_SPEC.md` y, especialmente, `SCRIPTS-SQL.md` (estructura oficial y pruebas de verificación).

### Variables de entorno necesarias para este hito
No aplica: este hito no despliega aplicación, solo crea la estructura en el proyecto Supabase `dbcrm123` (organización `Org CRM 123`) a través del conector MCP, que ya trae su propia autorización.

### Procedimiento
1. Crear el proyecto Supabase `dbcrm123` dentro de `Org CRM 123` (si aún no existe).
2. Ejecutar, en orden, las secciones 0 a 8 de `SCRIPTS-SQL.md` (extensiones, tipos, tablas, índices, funciones, triggers, vistas, RLS).
3. Ejecutar las pruebas de verificación de la sección 9 de `SCRIPTS-SQL.md` (estructura, políticas, funciones `security definer`, vistas, aislamiento entre usuarios).
4. Reportar al humano el resultado de cada prueba antes de continuar.

### Antes de las pruebas de funcionalidad
No hay variables que el humano deba actualizar en este hito.

**Entregable de cierre:** confirmación de que las 8 tablas, sus políticas RLS, funciones y vistas existen y pasan las pruebas de la sección 9. Se detiene y espera confirmación del humano antes de que arranque el Hito 2.

---

## Hito 2 — Entrar y desplegar

**Ejecutor:** Claude Code Web, tomando en cuenta `CLAUDE.md` y `TECHNICAL_SPEC.md`.

**Qué construye:** del proyecto, solo el ingreso (login con email + contraseña + verificación contra lista blanca — ver nota de desviación en `TECHNICAL_SPEC.md` sección 4), el armazón de navegación de ambas apps, y el tablero del día vacío (sin datos reales todavía, solo el estado "vacío" de `DESIGN_BRIEF.md`).

### Variables de entorno necesarias para este hito

| Variable | Procedimiento para obtener el valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Panel de Supabase → proyecto `dbcrm123` → Settings → API → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mismo panel → API → "anon public" key |

Claude Code Web debe verificar, antes de continuar, que estas variables están configuradas en los dos proyectos de Vercel (uno por app). Para probar el login hace falta además al menos una cuenta de prueba creada manualmente en Supabase (Authentication → Users → Add user) con su fila correspondiente en `authorized_users` — ver la nota de aprovisionamiento pendiente en `TECHNICAL_SPEC.md` sección 5.

### Procedimiento
1. Crear el esqueleto Next.js en `/web` y `/pwa` dentro de la rama `gh-crm-123`.
2. Configurar el cliente de Supabase (browser y servidor) en ambas apps.
3. Implementar el flujo de login descrito en `TECHNICAL_SPEC.md` sección 4, incluida la verificación server-side de `profiles` activo y el cierre de sesión si no está autorizado.
4. Construir la navegación base y el tablero del día en estado vacío, según `DESIGN_BRIEF.md` secciones 2.2 y 3.2.
5. Configurar la PWA (manifest, íconos, instalable) solo en `/pwa`.
6. Detenerse. No construir nada de oportunidades, clientes ni tareas todavía.

### Antes de las pruebas de funcionalidad
Si alguna de las variables anteriores no está aún en Vercel (dos proyectos) al llegar a este punto, Claude Code Web lo señala explícitamente al humano antes de proponer las pruebas.

**Entregable de cierre:** ambas apps desplegadas en Vercel (manualmente por el humano, tras el `push` a GitHub), con login funcional y tablero vacío. Se detiene y espera confirmación antes del Hito 3.

---

## Hito 3 — Núcleo comercial

**Ejecutor:** Claude Code Web, tomando en cuenta `CLAUDE.md` y `TECHNICAL_SPEC.md`.

**Qué construye:** agrega a lo existente lo que un vendedor usa todos los días: Clientes (crear/editar/archivar), Oportunidades (crear/editar, cambio de etapa con motivo de pérdida, archivar), Tareas (crear/completar, sueltas o ligadas a oportunidad), y el tablero del día ya con datos reales (tareas de hoy + oportunidades sin actividad reciente).

### Variables de entorno necesarias para este hito
Ninguna nueva respecto al Hito 2. Claude Code Web verifica que las del Hito 2 sigan correctamente configuradas antes de continuar.

### Procedimiento
1. Implementar las pantallas y Server Actions de Clientes, Oportunidades y Tareas descritas en `DESIGN_BRIEF.md` (secciones 2.3 a 2.5) y `TECHNICAL_SPEC.md` (sección 6.2), respetando estrictamente el modelo de `SCRIPTS-SQL.md`.
2. Cada acción de escritura relevante debe insertar su evento correspondiente en `activities`.
3. Completar el tablero del día (sección 2.2) con datos reales, usando las vistas `v_tasks_today` y `v_opportunities_stale`.
4. Detenerse. No construir aún el panel del supervisor ni el resumen matutino.

### Antes de las pruebas de funcionalidad
No hay variables nuevas que el humano deba actualizar en este hito.

**Entregable de cierre:** un vendedor puede, de principio a fin, registrar un cliente, crear una oportunidad, moverla de etapa, registrar tareas y completarlas, y ver su tablero del día reflejando esos datos. Se detiene y espera confirmación antes del Hito 4.

---

## Hito 4 — Supervisión y una automatización

**Ejecutor:** Claude Code Web, tomando en cuenta `CLAUDE.md` y `TECHNICAL_SPEC.md`.

**Qué construye:** agrega el panel del equipo del supervisor (pipeline consolidado, tareas por vendedor, ranking de ganadas del mes, reasignación de oportunidades, gestión de usuarios) y el flujo JSON de n8n del resumen matutino, listo para importar manualmente en n8n Cloud.

### Variables de entorno necesarias para este hito

| Variable | Procedimiento para obtener el valor |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Panel de Supabase → proyecto `dbcrm123` → Settings → API → "service_role" key. Se configura **solo** en el proyecto de Vercel de `/pwa`, nunca en `/web` ni expuesta como `NEXT_PUBLIC_*` |
| `N8N_SHARED_SECRET` | Se genera manualmente (una cadena aleatoria larga, por ejemplo con un gestor de contraseñas). Se configura igual en Vercel (`/pwa`) y en el nodo HTTP de n8n que llama al endpoint |
| `RESEND_API_KEY` | Panel de Resend → API Keys → crear una nueva |
| `RESEND_FROM_EMAIL` | Fijo: `onboarding@resend.dev` (no requiere creación, ya provisto) |

Claude Code Web verifica que las cuatro estén configuradas en el proyecto de Vercel de `/pwa` antes de continuar con las pruebas de este hito.

### Procedimiento
1. Implementar el panel del supervisor y el detalle por vendedor (`DESIGN_BRIEF.md` secciones 3.2 y 3.3), usando la vista `v_pipeline_by_stage`.
2. Implementar la reasignación de oportunidades (`reasignarOportunidad`) y la gestión de usuarios (alta/baja en `authorized_users`, sección 5 de `TECHNICAL_SPEC.md`).
3. Implementar el endpoint `/api/n8n/resumen-matutino` y el endpoint de disparo manual `/api/resumen-matutino/disparar`, exactamente según `TECHNICAL_SPEC.md` sección 6.1 (comparación de secreto con `crypto.timingSafeEqual`, uso de `service_role` solo en servidor).
4. Construir el flujo `WF-CRM123` en formato JSON exportable de n8n: un nodo de disparo por horario (Cron, 07:00 Europe/Madrid) → un nodo HTTP Request que llama a `/api/n8n/resumen-matutino` con el header `x-n8n-secret`. Entregar el JSON para que el humano lo importe manualmente en n8n Cloud (el flujo no se activa ni se configura por Claude Code Web dentro de n8n).
5. Implementar la pantalla de Resumen matutino (`DESIGN_BRIEF.md` sección 3.5) con el botón de disparo manual y el historial de envíos.

### Antes de las pruebas de funcionalidad
Si `SUPABASE_SERVICE_ROLE_KEY`, `N8N_SHARED_SECRET` o `RESEND_API_KEY` no están aún configuradas en Vercel, o si el flujo `WF-CRM123` no ha sido importado todavía en n8n Cloud, Claude Code Web lo señala explícitamente al humano antes de proponer las pruebas de este hito.

**Entregable de cierre:** el supervisor puede ver el estado del equipo completo, reasignar oportunidades, gestionar usuarios, y disparar el resumen matutino manualmente; el flujo automático diario queda importado en n8n Cloud y funcionando a las 07:00 hora de España.

---

## Cierre del proyecto

Al confirmarse el Hito 4, el CRM-123 queda completo según el alcance definido en `DESIGN_BRIEF.md`, `TECHNICAL_SPEC.md`, `CLAUDE.md` y `SCRIPTS-SQL.md`. Cualquier funcionalidad adicional no descrita en estos documentos se trata como un proyecto nuevo, no como una extensión silenciosa de este.
