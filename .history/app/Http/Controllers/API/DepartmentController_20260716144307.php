<?php

// Place this file at: app/Models/Concerns/Auditable.php

namespace App\Models\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * @mixin Model
 * @method static void created(\Closure|string $callback)
 * @method static void updated(\Closure|string $callback)
 * @method static void deleted(\Closure|string $callback)
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            static::recordAudit('created', $model, null, $model->getAttributes());
        });

        static::updated(function (Model $model) {
            static::recordAudit('updated', $model, $model->getOriginal(), $model->getChanges());
        });

        static::deleted(function (Model $model) {
            static::recordAudit('deleted', $model, $model->getOriginal(), null);
        });
    }

    protected static function recordAudit(string $event, Model $model, ?array $old, ?array $new): void
    {
        // Fields listed in a model's $auditExclude (e.g. ['password']) are
        // stripped from the logged payload so sensitive data never lands in audit_logs.
        $exclude = property_exists($model, 'auditExclude') ? $model->auditExclude : [];

        AuditLog::create([
            'user_id'        => Auth::id(),
            'event'          => $event,
            'auditable_type' => static::class,
            'auditable_id'   => $model->getKey(),
            'old_values'     => $old ? collect($old)->except($exclude)->toArray() : null,
            'new_values'     => $new ? collect($new)->except($exclude)->toArray() : null,
            'ip_address'     => request()?->ip(),
            'created_at'     => now(),
        ]);
    }
}
