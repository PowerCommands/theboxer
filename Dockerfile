FROM nginx:alpine
COPY src/index.html /usr/share/nginx/html/index.html
COPY src/assets /usr/share/nginx/html/assets
COPY src/scripts /usr/share/nginx/html/scripts
EXPOSE 80
