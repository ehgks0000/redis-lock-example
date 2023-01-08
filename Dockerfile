FROM node:18.12-slim AS base

# RUN apt-get update
# RUN apt-get install -y openssl

WORKDIR /app
COPY package-lock.json package.json ./
COPY tsconfig.json ./
RUN npm i -g typescript
RUN npm ci
COPY src src

RUN npm run build

USER node
CMD ["npm", "start"]
