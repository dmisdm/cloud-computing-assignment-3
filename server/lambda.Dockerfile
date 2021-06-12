
FROM public.ecr.aws/lambda/nodejs:14
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app


COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn .yarn
COPY server server
COPY prisma-client prisma-client
RUN npm i -g yarn
WORKDIR /usr/src/app/server
RUN yarn workspaces focus && yarn build && yarn workspaces focus --production && yarn cache clean --all



CMD ["server/dist/lambda.handler"]