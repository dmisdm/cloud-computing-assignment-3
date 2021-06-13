FROM node:alpine as builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn .yarn
COPY server server
COPY prisma-client prisma-client
COPY analytics analytics
WORKDIR /usr/src/app/server
RUN ls -la 
RUN yarn workspaces focus && yarn build && yarn workspaces focus --production && yarn dedupe && yarn cache clean --all


CMD ["./run-in-docker.sh"]