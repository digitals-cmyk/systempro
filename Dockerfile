# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default port for local testing, Railway will override this with the $PORT environment variable
ENV PORT=80
EXPOSE $PORT

CMD ["nginx", "-g", "daemon off;"]
