
FROM node:alpine as builder
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY . .
WORKDIR /usr/src/app/server
RUN yarn workspaces focus 
RUN yarn build
RUN yarn cache clean

FROM public.ecr.aws/lambda/nodejs:14

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=builder /usr/src/app/ /var/task


CMD ["server/dist/lambda.handler"]