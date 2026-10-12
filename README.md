# Invitación de Baby Shower

Aplicación responsive para invitaciones personalizadas, RSVP y selección privada de regalos. Está construida con Next.js App Router, TypeScript, Tailwind CSS, Supabase/PostgreSQL, Zod y Framer Motion, y puede desplegarse en Vercel.

## Requisitos

- Node.js 20.9 o superior y npm.
- Un proyecto de Supabase.
- Una cuenta de Vercel para publicar la aplicación.

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run dev
```

En Windows PowerShell, copia `.env.example` como `.env.local` con el Explorador o `Copy-Item .env.example .env.local`. Completa las variables antes de iniciar la aplicación. La página de invitación requiere Supabase conectado; nunca uses datos de demostración como sustituto del backend.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon; no otorga acceso a las tablas por las políticas RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso privilegiado exclusivamente en código de servidor. Nunca la incluyas en variables `NEXT_PUBLIC_`. |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres para firmar la cookie HttpOnly del invitado. |
| `ADMIN_EMAIL` | Único correo autorizado para entrar al panel de administración. |

Genera `SESSION_SECRET` con un gestor de contraseñas o un generador criptográfico (por ejemplo, `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). No compartas ni subas `.env.local` al repositorio. Está excluido por `.gitignore`; `.env.example` solo contiene nombres y valores de ejemplo.

## Configurar Supabase

1. Crea un proyecto y copia su URL, anon key y service role key en `.env.local`.
2. Ejecuta en orden `supabase/migrations/202610060001_initial_schema.sql` y `supabase/migrations/202610060002_gift_reservation_guest_snapshot.sql` en el SQL Editor de Supabase. También puedes instalar Supabase CLI, ejecutar `supabase init` si aún no existe `supabase/config.toml`, enlazar el proyecto con `supabase link --project-ref <ref>` y ejecutar `supabase db push`. La primera migración crea un evento inicial editable (con fecha de cortesía a 30 días); la segunda conserva el nombre de quien reservó aunque luego se elimine su registro de invitado.
3. Opcionalmente ejecuta `supabase/seed/seed.sql` en el SQL Editor para agregar invitados y regalos de demostración y reemplazar la configuración inicial por una de muestra. Los códigos del seed son únicamente para pruebas y deben reemplazarse o eliminarse antes de enviar invitaciones reales.
4. En **Authentication → Users**, crea una cuenta para la persona administradora usando exactamente el correo de `ADMIN_EMAIL`. Desactiva el registro público de usuarios. Este proyecto no ofrece un endpoint para crear administradores.
5. Conserva la `service_role` únicamente en variables server-side de Vercel/entorno local. Las tablas tienen RLS habilitado sin acceso directo para `anon` y `authenticated`; la aplicación usa funciones server-only que validan la sesión de invitado o la cuenta admin antes de utilizar la clave privilegiada.

### Esquema y reservas concurrentes

- `events` guarda configuración del evento; `guests` incluye un código de invitación único y RSVP; `gifts` guarda regalos y estado; `gift_reservations` relaciona regalo e invitado.
- La clave primaria `gift_reservations.gift_id` permite una sola reserva por regalo. `reserve_gift` inserta de forma atómica, comprueba que el invitado y el regalo pertenecen al mismo evento y que ambos están activos. Las peticiones simultáneas compiten en el índice único: solo una puede finalizar.
- La reserva guarda una copia del nombre del invitado. Si se elimina una reserva, el trigger libera el regalo; si se elimina al invitado, la reserva sigue activa y la copia del nombre permanece para el administrador. Los registros antiguos que ya perdieron tanto el vínculo del invitado como su nombre no se pueden reconstruir automáticamente. El público solo recibe nombre, descripción y estado del regalo.
- El token del invitado se firma en servidor y vive en una cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción. Desactivar un invitado invalida sus peticiones posteriores.

## Crear evento, invitados y regalos

- Inicia sesión en `/admin/login` con la cuenta Auth autorizada.
- El dashboard permite editar título, bebé, fecha, hora, zona horaria, lugar, dirección, detalles, mensaje, imagen y colores.
- En `/admin/invitados`, agrega nombres, copia códigos, genera códigos nuevos y gestiona invitaciones/RSVP. Cada código se valida otra vez en el servidor.
- En `/admin/regalos`, administra el catálogo, oculta o muestra regalos, libera reservas y consulta de forma privada quién reservó cada uno.

## Pruebas locales

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Prueba el flujo público con un código de invitado activo: inicio → invitación personalizada → RSVP → reservar un regalo. Abre otra sesión privada para verificar que el otro invitado solo ve «Ya seleccionado». Intenta reservar el mismo regalo desde dos sesiones y comprueba que la respuesta perdedora recibe un conflicto amigable. Revisa móvil estrecho, tablet, desktop, navegación por teclado y `prefers-reduced-motion`.

## Deploy en Vercel

1. Sube el repositorio a tu proveedor Git e impórtalo en Vercel como proyecto Next.js.
2. Añade las cinco variables de entorno anteriores a Development, Preview y Production. Usa valores distintos para proyectos de preview si corresponde.
3. Ejecuta la migración en el proyecto Supabase de producción y crea la cuenta admin antes de compartir el sitio.
4. Despliega. `npm run build` es el comando de producción; Vercel detecta Next.js automáticamente.
5. Añade el dominio personalizado en Vercel y configura los registros DNS indicados en su panel. Si utilizas URLs de redirección de Supabase Auth, agrega el dominio de producción en **Authentication → URL Configuration**.

## Música opcional

La interfaz no reproduce audio automáticamente. El control visual está preparado para incorporar un archivo de música; añade la pista y los controles de reproducción/volumen cuando exista un asset autorizado. La invitación sigue funcionando sin música.
