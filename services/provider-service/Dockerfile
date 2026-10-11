FROM node:20-alpine AS base

WORKDIR /app

# Dependencias del sistema requeridas por Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src/

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 3002

# Aplica las migraciones, carga el catálogo inicial (sin pisar datos existentes) y arranca
CMD ["npm", "run", "start:prod"]
