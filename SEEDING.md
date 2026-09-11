# Demo seeding

Run `php artisan migrate --force` followed by `php artisan db:seed` to load
the compact portfolio dataset. It creates five development-only accounts; each
uses the password `DemoInventory2026!`. Never use that password in a real
environment.

The seeders use stable business codes and do not delete unrelated data. New
received purchases and completed sales apply their stock movement once only.
