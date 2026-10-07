FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081
EXPOSE 19006

CMD ["npm", "run", "web"]
