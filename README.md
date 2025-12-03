# CMS AI Agent

Agente de IA para gestionar el CMS de tu tienda e-commerce con Strapi.

## Características

- 🤖 **Agente de IA con LangChain + Gemini 2.5 Flash**: Interactúa con tu CMS usando lenguaje natural
- 📦 **Gestión de Productos**: Crea, edita, elimina y consulta productos
- 📂 **Categorías**: Organiza tu catálogo con jerarquías
- 📝 **Blog**: Escribe y gestiona artículos
- 📊 **Órdenes**: Consulta y actualiza estados de pedidos
- 🖼️ **Multimodal**: Sube imágenes para crear productos desde catálogos
- ✅ **Confirmación de acciones**: Las operaciones de escritura requieren confirmación
- 📱 **UI moderna**: Interfaz de chat con historial de sesiones

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **IA**: LangChain, Google Gemini 2.5 Flash
- **Base de datos**: PostgreSQL (compartida con Strapi)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js v5 (Beta)
- **Estado**: Zustand
- **CMS**: Strapi (backend separado)

## Requisitos

- Node.js 18+
- PostgreSQL (misma instancia que Strapi)
- Strapi corriendo en puerto 1337
- API Key de Google AI (Gemini)

## Instalación

1. Clona el repositorio e instala dependencias:

```bash
cd idea-mia-cms-ai
npm install
```

2. Configura las variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Database (misma que Strapi)
DATABASE_URL="postgresql://strapi:strapi_password@localhost:5432/strapi?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro"

# Strapi
STRAPI_URL="http://localhost:1337"
STRAPI_API_TOKEN="tu-token-de-strapi"

# Google AI
GOOGLE_API_KEY="tu-api-key-de-google"
```

3. Genera el cliente de Prisma y sincroniza la base de datos:

```bash
npx prisma generate
npx prisma db push
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000)

## Configuración de Strapi

### Variables de entorno en Strapi

Añade estas variables en el archivo `.env` de tu proyecto Strapi:

```env
CMS_AI_WEBHOOK_URL=http://localhost:3000/api/webhooks/strapi
CMS_AI_WEBHOOK_SECRET=cms-ai-webhook-secret
```

Los webhooks ya están configurados automáticamente en `src/index.ts` del proyecto Strapi.

## Uso

### Autenticación

Inicia sesión con tus credenciales de administrador de Strapi. El sistema valida contra la API de autenticación de Strapi y almacena el JWT para las operaciones del CMS.

### Ejemplos de comandos

```
"Muéstrame los productos destacados"
"Crea un producto llamado 'Taza Personalizada' a S/25"
"Actualiza el stock del producto X a 50 unidades"
"Lista las últimas 5 órdenes pendientes"
"Publica todos los artículos en borrador"
```

### Operaciones con imágenes

Puedes subir imágenes de catálogos y el agente extraerá la información para crear productos:

```
[Sube imagen de catálogo]
"Crea los productos de esta imagen"
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth endpoints
│   │   ├── chat/                 # Chat API
│   │   └── webhooks/             # Strapi webhooks
│   ├── chat/                     # Chat page
│   └── login/                    # Login page
├── components/
│   ├── chat/                     # Chat components
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── langchain/                # AI agent, tools, prompts
│   ├── store/                    # Zustand stores
│   └── strapi/                   # Strapi client
├── types/                        # TypeScript types
└── auth.ts                       # NextAuth config
```

## Desarrollo

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Linting
npm run lint

# Prisma Studio (visualizar DB)
npx prisma studio
```

## Licencia

MIT
