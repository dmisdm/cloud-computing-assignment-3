FROM node:alpine
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY . .
WORKDIR /usr/src/app/server
RUN yarn workspaces focus
RUN yarn build
RUN yarn workspaces focus --production
RUN yarn cache clean --all

CMD ["./run-in-docker.sh"]