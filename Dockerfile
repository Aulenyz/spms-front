# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Usa .env.production (VITE_API_URL=/api/v1): el front llama a /api/v1 en su mismo dominio
# y nginx hace el proxy al backend.
RUN npm run build-prod

# ---- runtime ----
FROM nginx:1.27-alpine

# Backend al que nginx redirige /api/ (sin barra final). Sobrescribir en el despliegue.
ENV API_UPSTREAM=http://spms-api:8031

# nginx reemplaza las variables en los .template al arrancar
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1/healthz || exit 1
