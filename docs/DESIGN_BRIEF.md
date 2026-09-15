# DESIGN_BRIEF.md — CRM-123

Destinado a Claude Design. Sin código ni base de datos: solo pantallas, información, estados, flujos y dirección visual. La información mostrada respeta estrictamente la estructura de `SCRIPTS-SQL.md`, sin proponer campos nuevos.

## 1. Principios de diseño

- **Estándar, simplificado, minimalista, funcional.** Solo lo básico y necesario. Buenas prácticas de diseño y desarrollo.
- **Escritorio (CRM-123 Ventas) = denso y operativo.** El vendedor lo usa todo el día; prioriza velocidad, teclado, listas compactas, pocos clics para completar una tarea o mover una oportunidad de etapa.
- **PWA (CRM-123 Supervisor) = consulta rápida.** El supervisor la abre para mirar el estado del equipo, no para trabajar dentro de ella largo rato; prioriza claridad al vistazo, tarjetas grandes, pocos números clave por pantalla.
- **Idioma:** español (España). Nunca la palabra "eliminar"; siempre "archivar" o "desactivar".
- **Formato:** fechas `DD/MM/AAAA`, montos `1.234,56 €`.
- **Identidad visual:** no existe logo ni paleta previa. Claude Design propone una dirección visual minimalista desde cero para "CRM-123", coherente entre las dos aplicaciones pero con acentos que permitan distinguir a simple vista cuál se está usando (por ejemplo, un acento de color distinto entre Ventas y Supervisor, sobre una base neutra compartida).

## 2. CRM-123 Ventas (escritorio) — pantallas

### 2.1 Login
- Único botón "Entrar con Google".
- Estado de error: "Acceso no autorizado" si el correo no está en la lista del equipo (sin detalles técnicos).

### 2.2 Tablero del día (pantalla de inicio)
- **Información mostrada:**
  - Tareas pendientes de hoy y vencidas (tipo: Llamada/Reunión/Tarea, hora, cliente/oportunidad asociada si aplica, o "sin oportunidad" si es suelta).
  - Oportunidades sin actividad reciente (nombre del cliente, etapa actual, días sin actividad).
- **Estados:**
  - Vacío: "No tienes tareas pendientes hoy" con acceso directo a crear una.
  - Cargando: esqueleto de lista.
  - Error de carga: mensaje simple + botón reintentar.
- **Jerarquía:** tareas de hoy arriba (lo urgente), oportunidades frías debajo (lo que no debe olvidarse).

### 2.3 Oportunidades (lista + detalle)
- **Lista:** agrupada o filtrable por etapa (Nuevo, Contactado, Propuesta enviada, Negociación, Ganada, Perdida). Cada fila: cliente, título, valor en EUR, etapa, última actividad.
- **Detalle de una oportunidad:**
  - Datos: cliente vinculado, título, etapa, valor EUR, origen, fecha de creación, motivo de pérdida (solo visible/editable si etapa = Perdida).
  - Historial de actividad (de solo lectura, ordenado del más reciente al más antiguo).
  - Tareas ligadas a esta oportunidad (pendientes y completadas).
  - Acción de cambio de etapa: si se selecciona "Perdida", el sistema pide el motivo antes de guardar (campo obligatorio en ese momento, no antes).
  - Estado vacío (oportunidad recién creada): "Aún no hay actividad registrada".

### 2.4 Clientes (lista + detalle)
- **Lista:** buscable por nombre de empresa, persona de contacto o teléfono.
- **Detalle:** nombre de empresa, persona de contacto, teléfono, correo (opcional), país, código postal, notas. Debajo, oportunidades asociadas a este cliente.
- **Estado vacío:** "Aún no hay clientes registrados" con acceso a crear uno.
- Sin ningún campo de identificación personal.

### 2.5 Tareas (Llamada / Reunión / Tarea)
- Formulario simple: tipo, descripción, fecha/hora, oportunidad asociada (opcional — puede quedar "suelta").
- Lista de tareas propias, filtrable por Pendiente/Completada.
- Acción principal: marcar como completada (un clic).
- Estado vacío: "No tienes tareas registradas".

### 2.6 Estados transversales (todas las pantallas)
- **Vacío:** mensaje breve + acción para crear el primer elemento.
- **Cargando:** esqueletos, nunca pantalla en blanco.
- **Error:** mensaje simple en español, sin jerga técnica, con reintento.
- **Proceso en ejecución** (ej. guardando un cambio de etapa): botón deshabilitado con indicador breve, para evitar doble envío.

## 3. CRM-123 Supervisor (PWA) — pantallas

### 3.1 Login
- Igual que 2.1, con el mismo control de acceso.

### 3.2 Panel del equipo (pantalla de inicio)
- **Información mostrada:**
  - Pipeline consolidado: número de oportunidades y valor total en EUR por etapa, del equipo completo.
  - Tareas pendientes/vencidas, resumidas por vendedor (no el detalle completo, solo el conteo, con acceso a ver el detalle de uno).
  - Ranking simple de oportunidades ganadas del mes por vendedor.
- **Estados:** vacío (equipo sin actividad aún), cargando, error — mismo patrón que 2.6.
- **Jerarquía:** primero lo agregado del equipo (números grandes), luego el desglose por vendedor.

### 3.3 Detalle por vendedor
- Al tocar un vendedor desde el panel: sus oportunidades, sus tareas pendientes, su historial reciente — misma vista que tendría el propio vendedor en 2.2/2.3, en modo consulta.
- Acción disponible aquí: **reasignar** una oportunidad de este vendedor a otro (selector simple de nuevo dueño).

### 3.4 Gestión de usuarios
- Lista de los 12 usuarios (10 vendedores + 2 supervisores): nombre, correo, rol, estado (activo/inactivo).
- Alta: formulario con correo, nombre, rol.
- Baja: acción "Desactivar" (nunca "eliminar"), con confirmación breve.
- Estado vacío: no aplica (siempre hay al menos el propio supervisor).

### 3.5 Resumen matutino
- Pantalla simple que muestra: hora programada de envío (07:00, España), y un botón "Enviar ahora" para el disparo manual.
- Tras disparar manualmente: confirmación de envío o mensaje de error simple.
- Historial breve de los últimos envíos (fecha/hora, automático o manual).

## 4. Flujos clave

1. **Vendedor completa su día:** entra → ve tareas de hoy → completa una llamada → si corresponde, avanza la oportunidad de etapa → si la mueve a "Perdida", indica el motivo → el tablero se actualiza.
2. **Vendedor registra un cliente nuevo y su primera oportunidad:** desde Clientes, crea cliente (teléfono obligatorio) → desde el detalle del cliente, crea oportunidad vinculada.
3. **Supervisor reasigna trabajo:** entra a Detalle por vendedor → localiza la oportunidad → reasigna a otro vendedor → queda reflejado de inmediato en el tablero del nuevo dueño.
4. **Supervisor da de alta a un vendedor nuevo:** Gestión de usuarios → Alta → el vendedor ya puede entrar con su cuenta de Google la próxima vez que lo intente.
5. **Supervisor fuerza el envío del resumen:** Resumen matutino → "Enviar ahora" → confirmación.

## 5. Fuera de alcance para este diseño

- Sin pantalla de "papelera" ni de recuperación de elementos borrados (no existe borrado físico).
- Sin selector de zona horaria ni de moneda (fijos: Europe/Madrid, EUR).
- Sin registro público ni recuperación de contraseña (el acceso es solo Google).
