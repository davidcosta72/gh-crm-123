# TECHNICAL_SPEC.md — CRM-123

Destinado a Claude Code Web. Modelo de datos, seguridad por fila, endpoints y variables de entorno. La estructura de base de datos aquí referenciada es la de `SCRIPTS-SQL.md`; no se modifica desde aquí.

---

## 1. Arquitectura general

- **Dos aplicaciones Next.js (App Router)**, en carpetas separadas de la rama `gh-crm-123`:
  - `/web` — **CRM-123 Ventas**: app de escritorio para los 10 vendedores.
  - `/pwa` — **CRM-123 Supervisor**: PWA para los 2 supervisores, instalable.
- **Base de datos y autenticación:** Supabase (proyecto `dbcrm123`).
- **Autenticación:** Supabase Auth, proveedor Google OAuth únicamente. Sin registro público, sin email/contraseña.
- **Automatización:** n8n Cloud, flujo `WF-CRM123`, dispara el resumen matutino llamando a un endpoint de `/pwa`.
- **Correo:** Resend, remitente `onboarding@resend.dev`.
- **Zona horaria fija de todo el sistema:** `Europe/Madrid`.
- **Cada app se despliega como proyecto independiente en Vercel**, apuntando cada uno a su carpeta dentro de la misma rama.

## 2. Modelo de datos

Ver `SCRIPTS-SQL.md` para el DDL completo (tablas, tipos, índices, funciones, vistas y políticas RLS). Resumen de entidades:

| Tabla | Propósito | Mutabilidad |
|---|---|---|
| `authorized_users` | Lista blanca de correos con acceso | Insert/Update (solo supervisor) |
| `profiles` | Perfil funcional del usuario autenticado | Se crea por trigger; solo `UPDATE` por supervisor |
| `clients` | Clientes, identificados por teléfono | Insert/Update (equipo activo) |
| `opportunities` | Oportunidades de venta | Insert/Update (dueño o supervisor) |
| `tasks` | Llamada/Reunión/Tarea, pendiente→completada | Insert/Update (dueño o supervisor) |
| `activities` | Historial inmutable de eventos | Solo `INSERT` |
| `audit_log` | Auditoría de acciones administrativas | Solo `INSERT` |
| `settings` | Configuración no sensible | `SELECT` abierto, `UPDATE` supervisor |

Ningún dato de identificación personal (DPI/NIT/DNI/pasaporte) se solicita ni se almacena en ninguna tabla.

## 3. Seguridad por fila (RLS)

Resumen operativo (detalle exacto de cada política en `SCRIPTS-SQL.md` sección 8):

- **`profiles`**: cada usuario ve su propia fila; el supervisor ve todas. Solo el supervisor puede actualizar (para gestión de usuarios).
- **`clients`**: visibles y editables por cualquier perfil activo (dato compartido del equipo, no tiene dueño individual).
- **`opportunities`** y **`tasks`**: el vendedor ve y gestiona únicamente las suyas (`owner_id = auth.uid()`); el supervisor ve y gestiona todas. El `with check` en `UPDATE` es lo que impide que un vendedor reasigne una oportunidad a sí mismo o a otro: solo puede grabar su propio `owner_id`. Solo el supervisor puede escribir un `owner_id` distinto (reasignación real).
- **`activities`** y **`audit_log`**: cualquier perfil activo puede insertar (registrar un hecho); nadie puede modificar ni borrar. La lectura de `activities` sigue el mismo criterio dueño/supervisor que `opportunities`; `audit_log` solo lo lee el supervisor.
- **`authorized_users`**: gestión exclusiva del supervisor.
- **`settings`**: lectura abierta a cualquier autenticado (única política con condición `true` permitida), escritura solo supervisor.

El rol de cada usuario se determina **siempre** consultando `profiles` en el servidor (vía las funciones `get_my_role()` / `is_supervisor()` de `SCRIPTS-SQL.md`), nunca leyendo claims del JWT ni parámetros enviados por el cliente.

## 4. Autenticación y control de acceso (Google + lista blanca)

Flujo:

1. El usuario pulsa "Entrar con Google" en `/web` o `/pwa`.
2. Supabase Auth gestiona el OAuth de Google y crea (si no existe) una fila en `auth.users`.
3. El trigger `on_auth_user_created` (ver `SCRIPTS-SQL.md` sección 5) busca el correo en `authorized_users`. Si existe y está activo, crea el `profile` correspondiente. Si no, no crea nada.
4. El **Route Handler de callback** (`/auth/callback`), tras completar el login, hace un `select` a `profiles` para el `auth.uid()` actual, usando el cliente de servidor con la sesión del usuario (no la `service_role`).
5. **Si no existe un `profile` activo:** el Route Handler cierra la sesión (`supabase.auth.signOut()`) y redirige a una pantalla de "acceso no autorizado", sin exponer detalles internos.
6. **Si existe:** continúa al tablero correspondiente según `role` (`vendedor` → `/web`, `supervisor` → ambas apps, con foco en `/pwa`).

Esta verificación ocurre **en el servidor**, en cada sesión nueva; nunca se confía solo en el estado del cliente.

## 5. Gestión de usuarios (panel del supervisor)

El supervisor administra la lista blanca desde `/pwa`, sin tocar Supabase directamente:

- **Alta:** formulario con correo, nombre completo y rol (`vendedor`/`supervisor`) → `insert` en `authorized_users` vía Server Action, usando el cliente autenticado del supervisor (RLS ya exige `is_supervisor()`). Se registra un evento en `audit_log`.
- **Baja:** no se borra la fila; se marca `active = false` en `authorized_users` **y** en `profiles` si ya existía. Un usuario desactivado no puede volver a entrar (el trigger no reactiva, y el Route Handler del paso 4 anterior también valida `active = true` en `profiles`). Se registra en `audit_log`.
- El supervisor no puede desactivarse a sí mismo si es el único supervisor activo (validación en el Server Action, para no dejar el sistema sin administrador).

## 6. Endpoints de la aplicación

Todos los endpoints de escritura usan Server Actions o Route Handlers de Next.js; ninguno expone la `service_role key` al cliente.

### 6.1 `/pwa` — endpoints de n8n

**`POST /api/n8n/resumen-matutino`**

- Protegido por un secreto compartido, **no** por sesión de usuario (lo llama un sistema externo).
- El header `x-n8n-secret` se compara contra la variable de entorno `N8N_SHARED_SECRET` usando `crypto.timingSafeEqual` (nunca `===`), tras normalizar longitudes para evitar errores de comparación de buffers de distinto tamaño.
- Si el secreto no coincide: `401`, sin más detalle en la respuesta.
- Si coincide: el handler usa el cliente de `service_role` (server-only) para leer, por cada vendedor activo, sus `tasks` pendientes de hoy (vista `v_tasks_today`) y sus oportunidades sin actividad reciente (vista `v_opportunities_stale`), arma el contenido y llama a la API de Resend para enviar un correo por vendedor.
- Registra un evento en `activities` (`event_type = 'resumen_matutino_enviado'`) por cada envío.
- **n8n nunca consulta Postgres directamente**: solo llama a este endpoint.

**Disparo manual (supervisor, desde la PWA):**

- Endpoint distinto: `POST /api/resumen-matutino/disparar`, protegido por **sesión autenticada de supervisor** (`is_supervisor()`), no por el secreto de n8n.
- Internamente reutiliza la misma función de negocio que `/api/n8n/resumen-matutino` (una función compartida, no un segundo endpoint expuesto a n8n), para no duplicar lógica ni exponer `N8N_SHARED_SECRET` al cliente.
- Cada disparo manual también se registra en `activities`, con el `actor_id` del supervisor que lo ejecutó.

### 6.2 `/web` — endpoints del vendedor (Server Actions)

- `crearCliente`, `actualizarCliente` (sin `eliminarCliente`; solo `archivarCliente`)
- `crearOportunidad`, `actualizarOportunidad`, `cambiarEtapaOportunidad` (exige `loss_reason` si la etapa destino es `perdida`), `archivarOportunidad`
- `crearTarea`, `completarTarea`
- Cada una de estas acciones, tras su operación principal, inserta la fila correspondiente en `activities` dentro de la misma transacción lógica.

### 6.3 `/pwa` — endpoints del supervisor (Server Actions)

- Todo lo de `/web` (el supervisor tiene acceso completo), más:
- `reasignarOportunidad` (cambia `owner_id`)
- `crearUsuarioAutorizado`, `desactivarUsuarioAutorizado`
- `dispararResumenManual` (ver 6.1)

## 7. Variables de entorno

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `/web`, `/pwa` (cliente y servidor) | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `/web`, `/pwa` (cliente y servidor) | Clave pública, respeta RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor, solo `/pwa` (endpoint de n8n) | Clave con acceso total; nunca en el cliente |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Configuración del proveedor OAuth en Supabase Auth | Credenciales de Google Cloud para el login |
| `N8N_SHARED_SECRET` | Solo servidor, `/pwa` | Secreto compartido para validar llamadas de n8n |
| `RESEND_API_KEY` | Solo servidor, `/pwa` | Envío de correos del resumen matutino |
| `RESEND_FROM_EMAIL` | Solo servidor, `/pwa` | `onboarding@resend.dev` |

El procedimiento detallado para obtener el valor de cada variable, y en qué hito se necesita cada una, está en `BUILD_PLAN.md`.

## 8. Zona horaria, formato y moneda

- Toda fecha se almacena en `timestamptz` (UTC) y se muestra convertida a `Europe/Madrid`.
- Formato de visualización: `DD/MM/AAAA`, hora 24h.
- Montos: `EUR`, formato `1.234,56 €`.
- Idioma de interfaz, mensajes de error y correos: español (España).
