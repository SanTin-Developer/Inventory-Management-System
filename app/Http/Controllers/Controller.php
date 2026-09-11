<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Support\Facades\Log;

abstract class Controller
{
    /**
     * Escape SQL LIKE wildcards so user input is matched literally.
     * Escapes the pattern characters % and _ wherever they appear.
     */
    protected function escapeLike(string $value): string
    {
        return addcslashes($value, '%_');
    }

    /**
     * Map a raw database exception to a user-friendly message, logging the
     * real error so it is never lost, and never leaking SQL internals to
     * the client.
     */
    protected function friendlyErrorMessage(Exception $e, string $context): string
    {
        Log::error("{$context} failed", [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
        ]);

        $raw = $e->getMessage();

        // PostgreSQL trigger: negative stock
        if (str_contains($raw, 'Stock cannot be negative') || str_contains($raw, 'TRG_PREVENT_NEGATIVE_STOCK')) {
            return "One or more products don't have enough stock. Please check the quantities and try again.";
        }

        // PostgreSQL: foreign key violation (e.g. invalid product/supplier/customer id)
        if (str_contains($raw, 'violates foreign key constraint') || str_contains($raw, 'integrity constraint')) {
            return 'One of the selected records no longer exists. Please refresh and try again.';
        }

        // PostgreSQL / SQLite: unique constraint violation (e.g. duplicate code)
        if (str_contains($raw, 'duplicate key value violates unique constraint')
            || str_contains($raw, 'unique constraint')
            || str_contains($raw, 'UNIQUE constraint failed')) {
            return 'This record already exists.';
        }

        // Salary range trigger (pgsql-only, raised by plpgsql RAISE)
        if (str_contains($raw, 'Salary must be')) {
            return 'The salary is outside the allowed range for this role.';
        }

        return 'Something went wrong. Please try again.';
    }
}
