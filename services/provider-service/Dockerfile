FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY shared/contracts ./shared/contracts
COPY services/provider-service ./services/provider-service

RUN npm install --workspace=shared/contracts --workspace=services/provider-service
RUN npm run build --workspace=shared/contracts

WORKDIR /app/services/provider-service
RUN npx prisma generate
RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
