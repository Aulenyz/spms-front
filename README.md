# SPMS Front (Aulenyx)

Frontend del sistema de gestión escolar. React 18 + Vite 6 + TypeScript + Tailwind CSS 3, con
`@tanstack/react-query` v5 para la capa de datos.

## Requisitos

- Node.js 22 (probado con v22.23) y npm 10+.
- El backend (`spms-api`) corriendo y accesible. En desarrollo se espera en `http://localhost:8031/api/v1`.

## Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:5173
```

## Variables de entorno

Vite carga `.env.<modo>` según el modo de ejecución. Solo se usa una variable:

| Variable       | Descripción                         | development / example            | production |
|----------------|-------------------------------------|----------------------------------|------------|
| `VITE_API_URL` | URL base de la API (incluye `/api/v1`) | `http://localhost:8031/api/v1` | `/api/v1`  |

Si falta, `src/environment/environment.ts` usa `/api/v1` en producción y `http://localhost:8031/api/v1` en desarrollo.

En producción (`/api/v1`, mismo dominio) el hosting debe hacer de proxy hacia el backend. En Netlify hay un
bloque `[[redirects]]` comentado en `netlify.toml`: reemplaza `<BACKEND_URL>` por la URL real del backend y
descoméntalo. Sin ese proxy, la regla SPA devuelve `index.html` a las llamadas de la API; `BaseService` lo
detecta (respuesta `text/html`) y lo trata como error.

## Scripts

| Script               | Qué hace                                                        |
|----------------------|-----------------------------------------------------------------|
| `npm run dev`        | Servidor de desarrollo de Vite.                                 |
| `npm run build-dev`  | `tsc -b` + build con `.env.development`.                        |
| `npm run build-prod` | `tsc -b` + build con `.env.production` (el que usa Netlify).    |
| `npm run lint`       | ESLint.                                                         |
| `npm run preview`    | Sirve el contenido de `dist/`.                                  |

El build separa cada pantalla en su propio chunk (`React.lazy`) y agrupa dependencias en chunks de vendor
(`vendor-react`, `vendor-query`, `vendor-charts`, `vendor-forms`, `vendor-date`, `vendor-motion`, `vendor-ui`;
ver `vite.config.ts`).

## Estructura

```
src/
  app/            Configuración transversal
    query/        queryClient (opciones por defecto, toasts de error) y queryKeys
    routing/      lazyPage (React.lazy con exports nombrados) y RouteErrorBoundary
    navigation/   Menú lateral; security/: permisos requeridos por ruta
    providers/    ThemeProvider (claro/oscuro)
  assets/         Logo y plugins de Tailwind (componentes btn, card, menu, input, table, ...)
  components/     Componentes reutilizables (io = inputs/outputs, ui = layout/datos/feedback, shared = modales)
  contexts/       AuthContext (sesión, permisos, organización) y CompanyContext (organización activa)
  domain/         Modelos, tipos y filtros de listados (domain/filters/**)
  hooks/          useFilterEmitter, useDebouncedValue, useQueryParams y hooks de datos compartidos (hooks/queries)
  modules/        Pantallas por funcionalidad; cada módulo tiene su *Routing.tsx
  services/       Servicios HTTP (clases singleton que extienden BaseService)
  utils/          Utilidades (lang.ts reemplaza a lodash, URIs, fechas, textos, ...)
```

## Capa de datos

- **Servicios**: cada recurso tiene un servicio singleton (`StudentService.instance`, ...) que extiende
  `BaseService`. `BaseService` agrega los encabezados `authorization: Bearer <token>` y
  `X-Auth-Company: <id de organización>` (este último solo si hay una organización válida), y:
  - ante un **401** (excepto el login `POST /auth/token`) limpia la sesión y redirige a `/auth/login`;
  - trata una respuesta `text/html` como error;
  - admite cancelación: `service.withSignal(signal).metodo(...)` usa ese `AbortSignal` en las peticiones.
- **react-query**: las pantallas consultan con `useQuery` usando los servicios como `queryFn`:

  ```ts
  const {data = EMPTY_PAGE} = useQuery({
      queryKey: queryKeys.students.list({filters, pagination}),
      queryFn: ({signal}) => studentService.withSignal(signal).getAll(filters, pagination),
      placeholderData: keepPreviousData,
  });
  ```

  - Las claves están en `src/app/query/queryKeys.ts` con la forma `[recurso, ámbito, ...parámetros]`;
    los listados incluyen filtros y paginación.
  - Tras crear/editar/eliminar se invalida el prefijo del recurso:
    `queryClient.invalidateQueries({queryKey: queryKeys.students.all})`.
  - Opciones por defecto: `staleTime` 30 s, sin refetch al enfocar la ventana, 1 reintento (nunca para 4xx).
  - Los errores de consultas se muestran con un toast (`meta.errorMessage` personaliza el texto,
    `meta.silent` lo desactiva). Las páginas de error completas quedan para fallos de ruta.
- **Filtros** (`domain/filters/**`): usan `useWatch` y `useFilterEmitter`, que emite con debounce y solo cuando
  el valor cambia; el valor inicial no se emite, así que la página debe iniciar su estado con los mismos filtros.
- **Búsquedas**: `SearchSelect` aplica un debounce de 300 ms a `onSearch`.

## Sesión, organización y periodo

1. **Login** (`/auth/login`): `POST /auth/token` guarda el token en `localStorage` (`token_info`).
2. **Organización** (`/auth/select-organization`): se elige el espacio (si hay uno solo se selecciona solo);
   `switchOrganization` guarda el id en `localStorage` (`company_rnc`), refresca el token
   (`/auth/token/refresh`), carga el usuario y reinicia la caché de react-query.
3. **Validación**: `AuthContext` valida la sesión contra `GET /auth/current` una sola vez al montar o cuando
   cambia el token; en cada navegación solo verifica localmente que exista un token vigente.
4. **Periodo actual**: `useCurrentPeriod()` (`hooks/queries`) obtiene `/periods/current` una vez por
   organización y lo comparte; las consultas que dependen del periodo usan `enabled: Boolean(period?.id)`.
5. **Logout**: limpia `localStorage` (incluida la organización), la caché de consultas y vuelve al login.
