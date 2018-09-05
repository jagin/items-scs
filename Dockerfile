#
# ---- Base Node ----
FROM node:8 AS base
# set working directory
WORKDIR /app
# copy project file
COPY package.json .
COPY package-lock.json .

#
# ---- Dependencies ----
FROM base AS dependencies
# install node packages
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production
# copy production node_modules aside
RUN cp -R node_modules ../prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install

#
# ---- Test ----
# run linters, setup and tests
FROM dependencies AS test
COPY server server
COPY test test
RUN npm test

#
# ---- Production ----
FROM base AS release
# set environment
ENV HOST=0.0.0.0
ENV PORT=8000
ENV NODE_ENV=production
# install PM2 process manager
RUN npm install -g pm2
# copy production node_modules
COPY --from=dependencies /prod_node_modules node_modules
# copy app sources for production
COPY server server
# expose port and define ENTRYPOINT
EXPOSE 8000
USER node
ENTRYPOINT ["pm2-runtime", "server"]
