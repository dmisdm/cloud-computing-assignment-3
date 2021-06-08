FROM node:alpine
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY . .
RUN yarn workspaces focus server
WORKDIR /usr/src/app/server

CMD ["./run-in-docker.sh"]