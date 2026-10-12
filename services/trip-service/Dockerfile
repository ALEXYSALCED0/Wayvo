FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY shared/contracts ./shared/contracts
COPY services/trip-service ./services/trip-service

RUN npm install --workspace=shared/contracts --workspace=services/trip-service
RUN npm run build --workspace=shared/contracts

WORKDIR /app/services/trip-service
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
