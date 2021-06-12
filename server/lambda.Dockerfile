
FROM public.ecr.aws/lambda/nodejs:14
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /var/task


COPY package.json .yarnrc.yml yarn.lock ./
COPY .yarn .yarn
COPY server server
COPY prisma-client prisma-client
RUN npm i -g yarn
WORKDIR /var/task/server
RUN yarn workspaces focus && yarn build && yarn workspaces focus --production && yarn cache clean --all
WORKDIR /var/task


CMD ["server/dist/lambda.handler"]