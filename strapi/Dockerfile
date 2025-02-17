FROM node:20-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production && \
    rm -rf /var/cache/apk/* && \
    rm -rf ~/.npm

FROM node:20-alpine
RUN apk add --no-cache vips-dev

WORKDIR /opt/app
COPY --from=build --chown=node:node /opt/app /opt/app

USER node
EXPOSE 1337
CMD ["npm", "start"]
