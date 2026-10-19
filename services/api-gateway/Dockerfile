FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY shared/contracts ./shared/contracts
COPY services/api-gateway ./services/api-gateway

RUN npm install --workspace=shared/contracts --workspace=services/api-gateway
RUN npm run build --workspace=shared/contracts
RUN npm run build --workspace=services/api-gateway

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["npm", "start"]
