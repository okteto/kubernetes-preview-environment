FROM node:20-alpine as dev

WORKDIR /src

COPY package.json yarn.lock ./
RUN yarn install
COPY . .

RUN yarn build

FROM nginx:1.25-alpine
COPY --from=dev /src/dist /usr/share/nginx/html
EXPOSE 80
