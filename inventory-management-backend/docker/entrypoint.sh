#!/bin/sh
set -e

# Run migrations, retrying until PostgreSQL is reachable. The queue and
# scheduler services reuse this image; re-running is idempotent.
echo "Running migrations..."
mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions
until php artisan migrate --force --no-interaction; do
    echo "Database not ready yet, retrying in 2 seconds..."
    sleep 2
done

if [ $# -eq 0 ]; then
    set -- php-fpm
fi

exec "$@"