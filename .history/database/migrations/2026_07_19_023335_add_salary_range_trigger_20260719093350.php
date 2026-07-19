<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
            CREATE OR REPLACE TRIGGER trg_users_salary_range_check
            BEFORE INSERT OR UPDATE OF salary, role_id ON \"USERS\"
            FOR EACH ROW
            DECLARE
                v_min NUMBER;
                v_max NUMBER;
            BEGIN
                IF :NEW.salary IS NOT NULL THEN
                    SELECT default_salary_min, default_salary_max
                    INTO v_min, v_max
                    FROM roles
                    WHERE role_id = :NEW.role_id;

                    IF v_min IS NOT NULL AND v_max IS NOT NULL THEN
                        IF :NEW.salary < v_min OR :NEW.salary > v_max THEN
                            RAISE_APPLICATION_ERROR(
                                -20001,
                                'Salary must be between ' || v_min || ' and ' || v_max || ' for this role.'
                            );
                        END IF;
                    END IF;
                END IF;
            END;
        ");
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER trg_users_salary_range_check');
    }
};
