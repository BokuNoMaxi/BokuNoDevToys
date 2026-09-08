FROM node:20-alpine AS builder
ARG COMMIT_HASH=dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN COMMIT_HASH=${COMMIT_HASH} npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
