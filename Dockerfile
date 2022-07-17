FROM php:5-apache

RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf

ENV PORT=8080

EXPOSE 8080

WORKDIR /var/www/html

USER www-data

COPY . .
