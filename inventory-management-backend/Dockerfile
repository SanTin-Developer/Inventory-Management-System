FROM php:8.3-fpm-alpine

ARG UID=1000
ARG GID=1000

# System + build deps
RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        postgresql-dev \
        libzip-dev \
        oniguruma-dev \
    && apk add --no-cache \
        zip \
        unzip \
        git \
        curl \
        libzip \
        oniguruma \
        libpq \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        pcntl \
        bcmath \
    && apk del .build-deps

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# App user
RUN set -eux; \
    addgroup -g ${GID} app; \
    adduser -D -u ${UID} -G app app

WORKDIR /var/www/html

# App code + dependencies
COPY --chown=app:app . .
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && php artisan storage:link \
    && chown -R app:app storage bootstrap/cache

USER app

COPY --chown=app:app docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]