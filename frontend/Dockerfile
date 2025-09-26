FROM node:20-alpine as dev

WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn install
COPY . .

# For development, we stop here and run webpack serve
EXPOSE 80

FROM dev as build
RUN yarn build

FROM nginx:1.25-alpine
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
