FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copiar contracts y package.json del gateway
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install

COPY src ./src/

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
