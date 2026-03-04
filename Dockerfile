FROM busybox:1.37

WORKDIR /var/www/html

USER www-data

COPY . .

# Run BusyBox httpd on port 8080
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]
