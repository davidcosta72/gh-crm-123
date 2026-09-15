# SCRIPTS-SQL.md — CRM-123

**Estado:** Estructura oficial de base de datos. Este documento es la fuente de verdad para `DESIGN_BRIEF.md`, `TECHNICAL_SPEC.md`, `CLAUDE.md` y `BUILD_PLAN.md`. Ningún otro documento puede alterar esta estructura.

**Motor:** PostgreSQL (Supabase). Organización: `Org CRM 123`. Base de datos: `dbcrm123`.

**Nota de diseño importante:** `activities` es una tabla de solo inserción (regla de seguridad no negociable). Las tareas pendientes que un vendedor completa (Llamada / Reunión / Tarea) viven en la tabla `tasks`, que sí admite `UPDATE`. `activities` es el registro histórico e inmutable de lo que ha ocurrido (creación de tareas, finalización, cambios de etapa, reasignaciones). Esta separación no cambia ninguna decisión funcional, solo evita que una tabla mutable de trabajo diario choque con la regla de "solo inserción".

---

## 0. Extensiones necesarias

```sql
create extension if not exists "pgcrypto";
```

---

## 1. Tipos enumerados

```sql
create type public.user_role as enum ('vendedor', 'supervisor');

create type public.opportunity_stage as enum (
  'nuevo',
  'contactado',
  'propuesta_enviada',
  'negociacion',
  'ganada',
  'perdida'
);

create type public.opportunity_source as enum (
  'referido',
  'web',
  'llamada_fria',
  'evento',
  'otro'
);

create type public.task_type as enum ('llamada', 'reunion', 'tarea');

create type public.task_status as enum ('pendiente', 'completada');
```

---

## 2. Tablas

### 2.1 `authorized_users` — lista blanca de acceso (Google)

Como el acceso es por Google, cualquier cuenta de Google podría intentar entrar. Esta tabla es la lista blanca: solo los correos aquí presentes, con `active = true`, obtienen un perfil funcional al iniciar sesión.

```sql
create table public.authorized_users (
  email       text primary key,
  full_name   text not null,
  role        public.user_role not null,
  active      boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
```

### 2.2 `profiles` — perfil funcional del usuario autenticado

Se crea automáticamente (vía trigger) la primera vez que un correo autorizado inicia sesión con Google. El rol de la aplicación se lee siempre de aquí, nunca del JWT.

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text not null,
  role        public.user_role not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
```

### 2.3 `clients` — clientes (identificador: teléfono)

Prohibido cualquier identificador personal (DPI, NIT, DNI, pasaporte). El teléfono es el identificador único del cliente.

```sql
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  contact_name  text,
  phone         text not null unique,
  email         text,
  country       text not null default 'España',
  postal_code   text,
  notes         text,
  archived      boolean not null default false,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### 2.4 `opportunities` — oportunidades

```sql
create table public.opportunities (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id),
  owner_id     uuid not null references public.profiles(id),
  title        text not null,
  stage        public.opportunity_stage not null default 'nuevo',
  amount_eur   numeric(12,2),
  source       public.opportunity_source not null default 'otro',
  loss_reason  text,
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint loss_reason_required_if_perdida
    check (stage <> 'perdida' or loss_reason is not null)
);
```

### 2.5 `tasks` — actividades pendientes del vendedor (Llamada / Reunión / Tarea)

Puede estar ligada a una oportunidad o quedar "suelta" (`opportunity_id` nulo).

```sql
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid references public.opportunities(id),
  owner_id        uuid not null references public.profiles(id),
  type            public.task_type not null,
  status          public.task_status not null default 'pendiente',
  description     text not null,
  due_at          timestamptz not null,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  constraint completed_at_consistency
    check ((status = 'completada' and completed_at is not null)
        or (status = 'pendiente' and completed_at is null))
);
```

### 2.6 `activities` — registro histórico (solo inserción)

Cada fila es un hecho ya ocurrido. Nunca se actualiza ni se borra.

```sql
create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid not null references public.profiles(id),
  event_type   text not null,   -- ej: 'task_created','task_completed','opportunity_stage_changed','opportunity_reassigned'
  client_id    uuid references public.clients(id),
  opportunity_id uuid references public.opportunities(id),
  task_id      uuid references public.tasks(id),
  details      jsonb,
  created_at   timestamptz not null default now()
);
```

### 2.7 `audit_log` — auditoría de seguridad (solo inserción)

Acciones administrativas y de acceso (altas/bajas de usuarios, cambios de configuración). Nunca se actualiza ni se borra.

```sql
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id),
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  details     jsonb,
  created_at  timestamptz not null default now()
);
```

### 2.8 `settings` — configuración de la aplicación

Único caso permitido de política con condición `true` (solo en `select`).

```sql
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('timezone', '"Europe/Madrid"'),
  ('resumen_matutino_hora', '"07:00"'),
  ('currency', '"EUR"');
```

---

## 3. Índices

```sql
create index idx_opportunities_owner_id on public.opportunities(owner_id);
create index idx_opportunities_client_id on public.opportunities(client_id);
create index idx_opportunities_stage on public.opportunities(stage) where archived = false;
create index idx_tasks_owner_id_status on public.tasks(owner_id, status);
create index idx_tasks_due_at on public.tasks(due_at) where status = 'pendiente';
create index idx_tasks_opportunity_id on public.tasks(opportunity_id);
create index idx_activities_opportunity_id on public.activities(opportunity_id);
create index idx_activities_created_at on public.activities(created_at desc);
create index idx_clients_archived on public.clients(archived);
```

---

## 4. Funciones auxiliares (`security definer`, `search_path = public`)

Evitan recursión en las políticas RLS y centralizan la lectura del rol.

```sql
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() = 'supervisor' and public.get_my_active();
$$;
```

---

## 5. Trigger: creación automática de perfil al primer login

```sql
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
begin
  select * into v_auth
  from public.authorized_users
  where email = new.email and active = true;

  if found then
    insert into public.profiles (id, email, full_name, role, active)
    values (new.id, new.email, v_auth.full_name, v_auth.role, true)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
```

**Importante:** si el correo no está en `authorized_users` (o está `active = false`), no se crea perfil. La aplicación debe verificar en el primer request tras el login que exista un `profile` activo para `auth.uid()`; si no existe, debe cerrar la sesión y mostrar "acceso no autorizado". Esto se detalla en `TECHNICAL_SPEC.md`.

---

## 6. Trigger: `updated_at` automático

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();
```

---

## 7. Vistas (`security_invoker = true` obligatorio)

### 7.1 `v_tasks_today` — tablero del día

```sql
create view public.v_tasks_today
with (security_invoker = true) as
select t.*
from public.tasks t
where t.status = 'pendiente'
  and t.due_at <= (now() + interval '1 day')
order by t.due_at asc;
```

### 7.2 `v_pipeline_by_stage` — pipeline consolidado (panel del supervisor)

```sql
create view public.v_pipeline_by_stage
with (security_invoker = true) as
select
  o.owner_id,
  p.full_name as owner_name,
  o.stage,
  count(*) as total_oportunidades,
  coalesce(sum(o.amount_eur), 0) as valor_total_eur
from public.opportunities o
join public.profiles p on p.id = o.owner_id
where o.archived = false
group by o.owner_id, p.full_name, o.stage;
```

### 7.3 `v_opportunities_stale` — oportunidades sin actividad reciente

Sin actividad (ni `tasks` ni `activities`) en los últimos 5 días naturales.

```sql
create view public.v_opportunities_stale
with (security_invoker = true) as
select o.*
from public.opportunities o
where o.archived = false
  and o.stage not in ('ganada', 'perdida')
  and not exists (
    select 1 from public.activities a
    where a.opportunity_id = o.id
      and a.created_at > now() - interval '5 days'
  );
```

---

## 8. Row Level Security

### 8.1 Activar RLS en todas las tablas (sin excepción)

```sql
alter table public.authorized_users enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.opportunities enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;
```

### 8.2 `authorized_users` — solo supervisor

```sql
create policy "authorized_users_select_supervisor"
on public.authorized_users for select
using (public.is_supervisor());

create policy "authorized_users_insert_supervisor"
on public.authorized_users for insert
with check (public.is_supervisor());

create policy "authorized_users_update_supervisor"
on public.authorized_users for update
using (public.is_supervisor())
with check (public.is_supervisor());
```

### 8.3 `profiles`

```sql
create policy "profiles_select_own_or_supervisor"
on public.profiles for select
using (id = auth.uid() or public.is_supervisor());

create policy "profiles_update_supervisor_only"
on public.profiles for update
using (public.is_supervisor())
with check (public.is_supervisor());
```

*(Sin política de `insert`: los perfiles solo se crean vía el trigger de la sección 5, que corre como `security definer` y no depende de RLS.)*

### 8.4 `clients` — visibles y editables por todo el equipo activo

```sql
create policy "clients_select_active"
on public.clients for select
using (public.get_my_active());

create policy "clients_insert_active"
on public.clients for insert
with check (public.get_my_active() and created_by = auth.uid());

create policy "clients_update_active"
on public.clients for update
using (public.get_my_active())
with check (public.get_my_active());
```

### 8.5 `opportunities` — el vendedor gestiona las suyas; el supervisor, todas (incluida reasignación)

```sql
create policy "opportunities_select_own_or_supervisor"
on public.opportunities for select
using (owner_id = auth.uid() or public.is_supervisor());

create policy "opportunities_insert_own"
on public.opportunities for insert
with check (owner_id = auth.uid() and public.get_my_active());

create policy "opportunities_update_own_or_supervisor"
on public.opportunities for update
using (owner_id = auth.uid() or public.is_supervisor())
with check (owner_id = auth.uid() or public.is_supervisor());
```

El `with check` es lo que impide que un vendedor se autoasigne una oportunidad ajena: solo puede guardar `owner_id = auth.uid()`; solo el supervisor puede escribir un `owner_id` distinto (reasignación).

### 8.6 `tasks` — igual patrón que `opportunities`

```sql
create policy "tasks_select_own_or_supervisor"
on public.tasks for select
using (owner_id = auth.uid() or public.is_supervisor());

create policy "tasks_insert_own"
on public.tasks for insert
with check (owner_id = auth.uid() and public.get_my_active());

create policy "tasks_update_own_or_supervisor"
on public.tasks for update
using (owner_id = auth.uid() or public.is_supervisor())
with check (owner_id = auth.uid() or public.is_supervisor());
```

### 8.7 `activities` — solo inserción, para todo activo; lectura según pertenencia

```sql
create policy "activities_select_own_or_supervisor"
on public.activities for select
using (actor_id = auth.uid() or public.is_supervisor());

create policy "activities_insert_active"
on public.activities for insert
with check (actor_id = auth.uid() and public.get_my_active());
```

*(Sin política de `update` ni de `delete`, para nadie.)*

### 8.8 `audit_log` — solo inserción; lectura solo supervisor

```sql
create policy "audit_log_select_supervisor"
on public.audit_log for select
using (public.is_supervisor());

create policy "audit_log_insert_active"
on public.audit_log for insert
with check (public.get_my_active());
```

*(Sin política de `update` ni de `delete`, para nadie.)*

### 8.9 `settings` — lectura abierta (única excepción `true`), escritura solo supervisor

```sql
create policy "settings_select_all"
on public.settings for select
using (true);

create policy "settings_update_supervisor"
on public.settings for update
using (public.is_supervisor())
with check (public.is_supervisor());
```

**Ninguna tabla tiene política de `DELETE`.** El archivado es siempre lógico (`archived = true` en `clients`/`opportunities`, `active = false` en `profiles`/`authorized_users`).

---

## 9. Pruebas de verificación (para ejecutar tras la creación)

Estas pruebas deben ejecutarse con el conector MCP de Supabase antes de dar por cerrado el Hito 1.

### 9.1 Estructura

```sql
-- Todas las tablas esperadas existen
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Esperado: activities, audit_log, authorized_users, clients, opportunities,
--           profiles, settings, tasks

-- RLS activo en todas
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r';
-- Esperado: relrowsecurity = true en las 8 tablas
```

### 9.2 Políticas

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```
Verificar manualmente contra la sección 8: cero filas con `cmd = 'DELETE'`; `activities` y `audit_log` sin filas `cmd = 'UPDATE'`.

### 9.3 Funciones `security definer`

```sql
select proname, prosecdef,
  (select setting from unnest(proconfig) as setting where setting like 'search_path=%')
from pg_proc
where pronamespace = 'public'::regnamespace and prosecdef = true;
```
Verificar que cada función tenga `search_path=public` en `proconfig`.

### 9.4 Vistas `security_invoker`

```sql
select viewname from pg_views where schemaname = 'public';
select relname, reloptions from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'v';
```
Verificar `security_invoker=true` en `reloptions` de las 3 vistas.

### 9.5 Prueba funcional de aislamiento (simulada)

1. Insertar dos perfiles de prueba (vendedor A y vendedor B) y una oportunidad de cada uno.
2. Simular sesión de A (`set local role authenticated; set local request.jwt.claim.sub = '<uuid_A>';`) y confirmar que `select * from opportunities` solo devuelve la de A.
3. Confirmar que A no puede hacer `update opportunities set owner_id = '<uuid_B>' where id = '<id_de_A>'` (debe fallar el `with check`).
4. Simular sesión de supervisor y confirmar que sí puede reasignar.
5. Limpiar los datos de prueba (no antes de confirmar que no hay política de `delete`: el borrado de prueba debe hacerse con el rol `service_role`, nunca desde una sesión autenticada normal).

---

**Fin de SCRIPTS-SQL.md.** Esta estructura es vinculante para `DESIGN_BRIEF.md`, `TECHNICAL_SPEC.md`, `CLAUDE.md` y `BUILD_PLAN.md`.
