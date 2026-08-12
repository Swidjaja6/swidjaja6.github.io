FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

COPY --chown=nginx:nginx index.html     /usr/share/nginx/html/
COPY --chown=nginx:nginx 404.html       /usr/share/nginx/html/
COPY --chown=nginx:nginx thank-you.html /usr/share/nginx/html/
COPY --chown=nginx:nginx files/      /usr/share/nginx/html/files/
COPY --chown=nginx:nginx projects/   /usr/share/nginx/html/projects/
COPY --chown=nginx:nginx css/        /usr/share/nginx/html/css/
COPY --chown=nginx:nginx js/         /usr/share/nginx/html/js/
COPY --chown=nginx:nginx images/     /usr/share/nginx/html/images/
COPY --chown=nginx:nginx fonts/      /usr/share/nginx/html/fonts/
COPY --chown=nginx:nginx uploads/    /usr/share/nginx/html/uploads/

EXPOSE 8080