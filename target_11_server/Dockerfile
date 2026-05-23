FROM node:22-alpine
WORKDIR /app
COPY target_11_server/server.js .
COPY target_11 ./target_11
EXPOSE 5173
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080
ENV TARGET_11_ROOT=/app/target_11
CMD ["node", "server.js"]