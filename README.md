# CRM-123

Monorepo-lite: dos apps Next.js independientes en `/web` (CRM-123 Ventas, escritorio) y `/pwa` (CRM-123 Supervisor). Cada una se despliega como proyecto Vercel separado.

**Antes de tocar código, lee `docs/CLAUDE.md`.** Es el contrato de trabajo vinculante para este proyecto (seguridad, disciplina de hitos, estilo). Ninguna sesión de Claude Code Web debería avanzar sin haberlo leído.

## Documentación

- `docs/CLAUDE.md` — contrato de trabajo (léelo primero, en cada hito)
- `docs/BUILD_PLAN.md` — los 4 hitos y qué construye cada uno
- `docs/TECHNICAL_SPEC.md` — arquitectura, RLS, endpoints, variables de entorno
- `docs/SCRIPTS-SQL.md` — estructura de base de datos vinculante (no se altera)
- `docs/DESIGN_BRIEF.md` — pantallas, estados y flujos, sin código

## Diseño de referencia

`design/` — el bundle exportado de Claude Design: los tres `.dc.html` (prototipos navegables), el sistema `_ds/organic-*` (tokens y clases CSS) y `README.handoff.md` (valores visuales finales, componentes usados, desviaciones del brief). Se usa como referencia visual pixel-perfect; no se porta la estructura interna de los `.dc.html`, solo su resultado visual.

**Nota:** el login que describe `design/README.handoff.md` (y el mockup original) es "Entrar con Google". Eso cambió en Hito 2 a email + contraseña de Supabase Auth, a petición explícita del humano — `docs/TECHNICAL_SPEC.md` sección 4 documenta la desviación. `design/` queda tal cual como registro histórico de lo que se diseñó, no se edita.

## Estado

- **Hito 1** (base de datos Supabase `dbcrm123`): completado y verificado.
- **Hito 2** (login + armazón de navegación + tablero/panel vacío): en curso en este repositorio. Login cambiado de Google OAuth a email/contraseña (ver nota arriba); pendiente definir en Hito 4 cómo se aprovisionan las cuentas con contraseña (`docs/TECHNICAL_SPEC.md` sección 5).
