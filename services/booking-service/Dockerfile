FROM node:20-alpine AS base

WORKDIR /app

# Instalar dependencias del sistema requeridas para Prisma y compilación
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src/

# Generar cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
