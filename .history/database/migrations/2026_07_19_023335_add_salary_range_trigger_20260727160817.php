<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('
        CREATE OR REPLACE FUNCTION trg_users_salary_range_check_fn()
        RETURNS TRIGGER AS $$
        DECLARE
            v_min NUMERIC;
            v_max NUMERIC;
        BEGIN
            IF NEW.salary IS NOT NULL THEN
                SELECT default_salary_min, default_salary_max
                INTO v_min, v_max
                FROM roles
                WHERE role_id = NEW.role_id;

                IF v_min IS NOT NULL AND v_max IS NOT NULL THEN
                    IF NEW.salary < v_min OR NEW.salary > v_max THEN
                        RAISE EXCEPTION
                            \'Salary must be between % and % for this role.\', v_min, v_max;
                    END IF;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_users_salary_range_check
        BEFORE INSERT OR UPDATE OF salary, role_id ON users
        FOR EACH ROW
        EXECUTE FUNCTION trg_users_salary_range_check_fn();
    ');
    }

    public function down(): void
    {
        DB::unprepared('
        DROP TRIGGER IF EXISTS trg_users_salary_range_check ON users;
        DROP FUNCTION IF EXISTS trg_users_salary_range_check_fn();
    ');
    }
};
