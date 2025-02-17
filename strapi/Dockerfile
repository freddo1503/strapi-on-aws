# Creating multi-stage build for production
FROM node:20-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_URL=${STRAPI_URL}

WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install
ENV PATH /opt/app/node_modules/.bin:$PATH
COPY . .
RUN npm run build

# Creating final production image
FROM node:20-alpine
RUN apk add --no-cache vips-dev
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV STRAPI_URL=${STRAPI_URL}

WORKDIR /opt/app
COPY --from=build --chown=node:node /opt/app /opt/app
ENV PATH /opt/app/node_modules/.bin:$PATH

USER node
EXPOSE 1337
CMD ["npm", "start"]
