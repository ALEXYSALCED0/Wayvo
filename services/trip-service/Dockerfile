FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install

COPY src ./src/

RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
