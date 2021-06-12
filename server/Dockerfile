FROM node:alpine as builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn .yarn
COPY server server
COPY prisma-client prisma-client
COPY analytics/mapreducer/build/libs/mapreducer-1.0-SNAPSHOT-all.jar analytics/mapreducer/build/libs/mapreducer-1.0-SNAPSHOT-all.jar

WORKDIR /usr/src/app/server
RUN ls -la 
RUN yarn workspaces focus && yarn build && yarn workspaces focus --production && yarn dedupe && yarn cache clean --all


CMD ["./run-in-docker.sh"]