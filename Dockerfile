FROM php:5-apache

EXPOSE 80

WORKDIR /var/www/html

USER www-data

COPY . .
