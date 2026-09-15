# CLAUDE.md — Contrato para Claude Code Web · Proyecto CRM-123

Este documento es el contrato de trabajo para cualquier sesión de Claude Code Web sobre este repositorio. Se lee al inicio de cada hito. Ninguna regla de esta sección se relaja por comodidad, velocidad o preferencia de estilo.

## 1. Identidad del proyecto

- Nombre de marca: **CRM-123**
- App de escritorio (vendedores): **CRM-123 Ventas**
- PWA (supervisor): **CRM-123 Supervisor**
- Rama de trabajo: `gh-crm-123`, con dos carpetas: `/web` (escritorio) y `/pwa` (supervisor)
- Framework: Next.js (App Router) en ambas apps
- Base de datos: Supabase, proyecto `dbcrm123`, organización `Org CRM 123`
- Estructura de base de datos oficial: **`SCRIPTS-SQL.md`**. No se altera desde código de aplicación. Si algo parece faltar, se señala al humano; no se improvisa un `alter table`.
- Zona horaria fija de toda la aplicación: `Europe/Madrid`
- Idioma de interfaz: español (España). Formato de fecha `DD/MM/AAAA`, moneda `1.234,56 €`.
- Despliegue: Vercel, dos proyectos separados, uno por carpeta. El paso de GitHub a Vercel es **manual**, nunca automatizado por Claude Code Web.

## 2. Seguridad, lo innegociable

Estas reglas no se relajan por comodidad ni por prisa. Se verifican en cada comando de base de datos y en cada endpoint que se escriba.

- **RLS activa en todas las tablas**, incluidas configuración y auditoría. Ninguna excepción.
- **Ninguna política de `DELETE`.** No hay borrado físico, solo archivado lógico (`archived` o `active`). Nunca uses la palabra "eliminar" en la interfaz; usa "archivar" o "desactivar".
- **`activities` y `audit_log` son solo de inserción.** Sin políticas de `UPDATE` ni `DELETE` para nadie, incluido el supervisor. El estado mutable de trabajo diario (pendiente/completada) vive en `tasks`, no en `activities`.
- **Toda política de `UPDATE` lleva `with check`**, no solo `using`. Sin él, un vendedor cambia `owner_id` y se queda con la oportunidad de otro.
- **Ninguna política con condición `true`**, salvo el `select` de `settings`.
- **Todas las vistas con `security_invoker = true`.** Una vista sin esto filtra los datos de todo el equipo a cualquier vendedor.
- **Toda función `security definer` fija `search_path = public`.**
- **`SUPABASE_SERVICE_ROLE_KEY` nunca sale del servidor.** Solo en Route Handlers y Server Actions. Jamás en un componente cliente, ni siquiera importado sin usar.
- **Los secretos se comparan con `crypto.timingSafeEqual`**, nunca con `===`. Aplica en particular al header compartido que valida las llamadas de n8n.
- **El rol se lee de la tabla `profiles`**, nunca de un JWT ni de nada que venga del cliente.
- **n8n nunca toca Postgres.** Todo pasa por los endpoints `/api/n8n/*` de la aplicación.
- **El login es por email + contraseña (Supabase Auth) contra lista blanca.** *(Cambiado en Hito 2 a petición explícita del humano; originalmente era Google OAuth — ver `TECHNICAL_SPEC.md` sección 4 para el detalle de la desviación.)* Unas credenciales válidas no son suficientes: si no existe un `profile` activo para ese usuario (ver `SCRIPTS-SQL.md` sección 5), la sesión se cierra inmediatamente y se muestra "acceso no autorizado". Esta verificación ocurre en el servidor (`lib/dal.ts`), nunca solo en el cliente. No hay registro público: las cuentas de `auth.users` las provisiona el supervisor (mecanismo exacto pendiente de Hito 4, ver `TECHNICAL_SPEC.md` sección 5).

## 3. Disciplina de trabajo por hitos

- Claude Code Web trabaja en **3 hitos de despliegue** (definidos en `BUILD_PLAN.md`).
- **No se avanza al hito siguiente sin confirmación explícita del humano.** Al terminar un hito, Claude Code Web se detiene, resume lo construido y espera.
- Cada hito entrega: el procedimiento a seguir y la lista de variables de entorno que deben crearse en Vercel para ese hito, explicadas en lenguaje simple (qué es, de dónde se obtiene).
- Antes de las pruebas de funcionalidad de cada hito, si el humano debe actualizar alguna variable de entorno, se le avisa explícitamente al final del hito.

## 4. Estilo de desarrollo

- Diseño y desarrollo **estándar, simplificado, minimalista y funcional**. Opciones estrictamente básicas y necesarias. Nada de funciones "por si acaso".
- El escritorio (vendedores) es denso y operativo: prioriza velocidad de uso diario.
- La PWA (supervisor) es de consulta rápida: prioriza claridad al vistazo, no densidad.
- Seguir la dirección visual de `DESIGN_BRIEF.md` una vez exista; no inventar pantallas ni campos fuera de `SCRIPTS-SQL.md` y `TECHNICAL_SPEC.md`.
- Sin identificadores personales en ningún formulario ni tabla (DPI, NIT, DNI, pasaporte). El teléfono es el identificador del cliente.

## 5. Qué hacer si algo no cuadra

Si al implementar un hito, algo en `TECHNICAL_SPEC.md` o `SCRIPTS-SQL.md` parece contradictorio, incompleto o inseguro: **detenerse y preguntar al humano**, no decidir por cuenta propia ni "arreglarlo" silenciosamente. La seguridad de este documento tiene prioridad sobre la velocidad de entrega.
