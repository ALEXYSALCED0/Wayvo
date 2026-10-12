FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
COPY shared/contracts ./shared/contracts
COPY apps/client ./apps/client

RUN npm install --workspace=shared/contracts --workspace=@wayvo/client
RUN npm run build --workspace=shared/contracts

WORKDIR /app/apps/client

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
