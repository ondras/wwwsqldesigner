FROM busybox:1.37

RUN adduser -D static

# USER static
# WORKDIR /home/static

USER www-data
WORKDIR /var/www/html

COPY . .

# Run BusyBox httpd
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]
