<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
            -- ================= VIEWS =================
            CREATE OR REPLACE VIEW vw_product_inventory AS
            SELECT
                p.product_id, p.product_code, p.product_name,
                c.category_name, p.unit_price, p.cost_price,
                p.quantity_in_stock, p.reorder_level, p.unit
            FROM products p
            JOIN categories c ON p.category_id = c.category_id;

            CREATE OR REPLACE VIEW vw_low_stock_products AS
            SELECT product_id, product_code, product_name, quantity_in_stock, reorder_level
            FROM products
            WHERE quantity_in_stock <= reorder_level;

            CREATE OR REPLACE VIEW vw_purchase_summary AS
            SELECT
                pu.purchase_id, s.supplier_name, u.name AS created_by,
                pu.purchase_date, pu.total_amount, pu.status
            FROM purchases pu
            JOIN suppliers s ON pu.supplier_id = s.supplier_id
            JOIN users u ON pu.user_id = u.user_id;

            CREATE OR REPLACE VIEW vw_sales_summary AS
            SELECT
                s.sale_id, u.name AS employee, s.customer_name,
                s.sale_date, s.total_amount, s.payment_method, s.status
            FROM sales s
            JOIN users u ON s.user_id = u.user_id;

            CREATE OR REPLACE VIEW vw_product_sales_report AS
            SELECT
                p.product_id, p.product_name,
                SUM(sd.quantity) AS total_quantity_sold,
                SUM(sd.subtotal) AS total_revenue
            FROM products p
            JOIN sale_details sd ON p.product_id = sd.product_id
            GROUP BY p.product_id, p.product_name;

            CREATE OR REPLACE VIEW vw_inventory_value AS
            SELECT
                product_id, product_name, quantity_in_stock, cost_price,
                (quantity_in_stock * cost_price) AS inventory_value
            FROM products;

            -- ================= FUNCTIONS =================
            CREATE OR REPLACE FUNCTION fn_get_product_stock(p_product_id BIGINT)
            RETURNS NUMERIC AS \$\$
            DECLARE
                v_stock NUMERIC;
            BEGIN
                SELECT quantity_in_stock INTO v_stock
                FROM products WHERE product_id = p_product_id;
                RETURN COALESCE(v_stock, 0);
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    RETURN 0;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION fn_purchase_total(p_purchase_id BIGINT)
            RETURNS NUMERIC AS \$\$
            DECLARE
                v_total NUMERIC;
            BEGIN
                SELECT SUM(quantity * unit_cost) INTO v_total
                FROM purchase_details WHERE purchase_id = p_purchase_id;
                RETURN COALESCE(v_total, 0);
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION fn_sale_total(p_sale_id BIGINT)
            RETURNS NUMERIC AS \$\$
            DECLARE
                v_total NUMERIC;
            BEGIN
                SELECT SUM(quantity * unit_price) INTO v_total
                FROM sale_details WHERE sale_id = p_sale_id;
                RETURN COALESCE(v_total, 0);
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION fn_check_stock_status(p_product_id BIGINT)
            RETURNS VARCHAR AS \$\$
            DECLARE
                v_stock NUMERIC;
                v_level NUMERIC;
            BEGIN
                SELECT quantity_in_stock, reorder_level
                INTO v_stock, v_level
                FROM products WHERE product_id = p_product_id;

                IF v_stock <= v_level THEN
                    RETURN 'LOW STOCK';
                ELSE
                    RETURN 'STOCK OK';
                END IF;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE OR REPLACE FUNCTION fn_inventory_value(p_product_id BIGINT)
            RETURNS NUMERIC AS \$\$
            DECLARE
                v_value NUMERIC;
            BEGIN
                SELECT quantity_in_stock * cost_price INTO v_value
                FROM products WHERE product_id = p_product_id;
                RETURN v_value;
            END;
            \$\$ LANGUAGE plpgsql;

            -- ================= PROCEDURES =================
            CREATE OR REPLACE PROCEDURE sp_add_product(
                p_category_id BIGINT, p_product_name VARCHAR, p_product_code VARCHAR,
                p_unit_price NUMERIC, p_cost_price NUMERIC, p_quantity NUMERIC,
                p_reorder_level NUMERIC, p_unit VARCHAR
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                INSERT INTO products
                    (category_id, product_name, product_code, unit_price, cost_price, quantity_in_stock, reorder_level, unit)
                VALUES
                    (p_category_id, p_product_name, p_product_code, p_unit_price, p_cost_price, p_quantity, p_reorder_level, p_unit);
            END;
            \$\$;

            CREATE OR REPLACE PROCEDURE sp_create_purchase(
                p_supplier_id BIGINT, p_user_id BIGINT, p_product_id BIGINT,
                p_quantity NUMERIC, p_unit_cost NUMERIC
            )
            LANGUAGE plpgsql AS \$\$
            DECLARE
                v_purchase_id BIGINT;
            BEGIN
                INSERT INTO purchases (supplier_id, user_id, total_amount, status)
                VALUES (p_supplier_id, p_user_id, p_quantity * p_unit_cost, 'Received')
                RETURNING purchase_id INTO v_purchase_id;

                INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_cost)
                VALUES (v_purchase_id, p_product_id, p_quantity, p_unit_cost);

                UPDATE products SET quantity_in_stock = quantity_in_stock + p_quantity
                WHERE product_id = p_product_id;
            END;
            \$\$;

            CREATE OR REPLACE PROCEDURE sp_process_sale(
                p_user_id BIGINT, p_customer_name VARCHAR, p_product_id BIGINT,
                p_quantity NUMERIC, p_price NUMERIC
            )
            LANGUAGE plpgsql AS \$\$
            DECLARE
                v_sale_id BIGINT;
                v_stock NUMERIC;
            BEGIN
                SELECT quantity_in_stock INTO v_stock FROM products WHERE product_id = p_product_id;

                IF v_stock < p_quantity THEN
                    RAISE EXCEPTION 'Not enough stock';
                END IF;

                INSERT INTO sales (user_id, customer_name, total_amount)
                VALUES (p_user_id, p_customer_name, p_quantity * p_price)
                RETURNING sale_id INTO v_sale_id;

                INSERT INTO sale_details (sale_id, product_id, quantity, unit_price)
                VALUES (v_sale_id, p_product_id, p_quantity, p_price);

                UPDATE products SET quantity_in_stock = quantity_in_stock - p_quantity
                WHERE product_id = p_product_id;
            END;
            \$\$;

            CREATE OR REPLACE PROCEDURE sp_update_product_price(
                p_product_id BIGINT, p_new_price NUMERIC
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                UPDATE products SET unit_price = p_new_price WHERE product_id = p_product_id;
            END;
            \$\$;

            -- ================= TRIGGERS (safe subset) =================
            CREATE OR REPLACE FUNCTION trg_products_updated_at_fn() RETURNS TRIGGER AS \$\$
            BEGIN
                NEW.updated_at := NOW();
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION trg_products_updated_at_fn();

            CREATE OR REPLACE FUNCTION trg_purchase_total_fn() RETURNS TRIGGER AS \$\$
            DECLARE
                v_purchase_id BIGINT;
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    v_purchase_id := OLD.purchase_id;
                ELSE
                    v_purchase_id := NEW.purchase_id;
                END IF;

                UPDATE purchases
                SET total_amount = (
                    SELECT COALESCE(SUM(quantity * unit_cost), 0)
                    FROM purchase_details WHERE purchase_id = v_purchase_id
                )
                WHERE purchase_id = v_purchase_id;

                RETURN NULL;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_purchase_total
            AFTER INSERT OR UPDATE OR DELETE ON purchase_details
            FOR EACH ROW
            EXECUTE FUNCTION trg_purchase_total_fn();

            CREATE OR REPLACE FUNCTION trg_sale_total_fn() RETURNS TRIGGER AS \$\$
            DECLARE
                v_sale_id BIGINT;
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    v_sale_id := OLD.sale_id;
                ELSE
                    v_sale_id := NEW.sale_id;
                END IF;

                UPDATE sales
                SET total_amount = (
                    SELECT COALESCE(SUM(quantity * unit_price), 0)
                    FROM sale_details WHERE sale_id = v_sale_id
                ) - COALESCE(discount_amount, 0)
                WHERE sale_id = v_sale_id;

                RETURN NULL;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_sale_total
            AFTER INSERT OR UPDATE OR DELETE ON sale_details
            FOR EACH ROW
            EXECUTE FUNCTION trg_sale_total_fn();

            CREATE OR REPLACE FUNCTION trg_prevent_negative_stock_fn() RETURNS TRIGGER AS \$\$
            BEGIN
                IF NEW.quantity_in_stock < 0 THEN
                    RAISE EXCEPTION 'Stock cannot be negative';
                END IF;
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_prevent_negative_stock
            BEFORE UPDATE OF quantity_in_stock ON products
            FOR EACH ROW
            EXECUTE FUNCTION trg_prevent_negative_stock_fn();

            -- Stock history table + trigger
            CREATE TABLE IF NOT EXISTS stock_history (
                history_id BIGSERIAL PRIMARY KEY,
                product_id BIGINT NOT NULL REFERENCES products(product_id),
                transaction_type VARCHAR(30),
                quantity NUMERIC,
                old_quantity NUMERIC,
                new_quantity NUMERIC,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE OR REPLACE FUNCTION trg_stock_history_fn() RETURNS TRIGGER AS \$\$
            BEGIN
                INSERT INTO stock_history (product_id, transaction_type, quantity, old_quantity, new_quantity)
                VALUES (OLD.product_id, 'STOCK UPDATE', NEW.quantity_in_stock - OLD.quantity_in_stock, OLD.quantity_in_stock, NEW.quantity_in_stock);
                RETURN NEW;
            END;
            \$\$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_stock_history
            AFTER UPDATE OF quantity_in_stock ON products
            FOR EACH ROW
            EXECUTE FUNCTION trg_stock_history_fn();
        ");
    }

    public function down(): void
    {
        DB::unprepared('
            DROP TRIGGER IF EXISTS trg_stock_history ON products;
            DROP FUNCTION IF EXISTS trg_stock_history_fn();
            DROP TABLE IF EXISTS stock_history;
            DROP TRIGGER IF EXISTS trg_prevent_negative_stock ON products;
            DROP FUNCTION IF EXISTS trg_prevent_negative_stock_fn();
            DROP TRIGGER IF EXISTS trg_sale_total ON sale_details;
            DROP FUNCTION IF EXISTS trg_sale_total_fn();
            DROP TRIGGER IF EXISTS trg_purchase_total ON purchase_details;
            DROP FUNCTION IF EXISTS trg_purchase_total_fn();
            DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
            DROP FUNCTION IF EXISTS trg_products_updated_at_fn();
            DROP PROCEDURE IF EXISTS sp_update_product_price;
            DROP PROCEDURE IF EXISTS sp_process_sale;
            DROP PROCEDURE IF EXISTS sp_create_purchase;
            DROP PROCEDURE IF EXISTS sp_add_product;
            DROP FUNCTION IF EXISTS fn_inventory_value;
            DROP FUNCTION IF EXISTS fn_check_stock_status;
            DROP FUNCTION IF EXISTS fn_sale_total;
            DROP FUNCTION IF EXISTS fn_purchase_total;
            DROP FUNCTION IF EXISTS fn_get_product_stock;
            DROP VIEW IF EXISTS vw_inventory_value;
            DROP VIEW IF EXISTS vw_product_sales_report;
            DROP VIEW IF EXISTS vw_sales_summary;
            DROP VIEW IF EXISTS vw_purchase_summary;
            DROP VIEW IF EXISTS vw_low_stock_products;
            DROP VIEW IF EXISTS vw_product_inventory;
        ');
    }
};
