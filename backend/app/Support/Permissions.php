<?php

namespace App\Support;

class Permissions
{
    public static function level(string $resource, ?string $roleName): string
    {
        $matrix = config('permissions')[$resource] ?? [];

        // Simple list format (view-only pages)
        if (array_is_list($matrix)) {
            return in_array($roleName, $matrix, true) ? 'view' : 'none';
        }

        // CRUD resources
        return $matrix[$roleName] ?? 'none';
    }

    public static function canWrite(string $resource, ?string $roleName): bool
    {
        return self::level($resource, $roleName) === 'full';
    }

    public static function canView(string $resource, ?string $roleName): bool
    {
        return in_array(self::level($resource, $roleName), ['full', 'view'], true);
    }
}
