<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Department;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/** Compact, Cambodia-focused data for a local portfolio/demo installation. */
class ProductionDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $roles = $this->upsert(Role::class, 'role_code', [
                ['ADM', 'Admin', 'Full system access and operational oversight.', 900, 1800],
                ['MGR', 'Manager', 'Sales, purchasing, and inventory management.', 700, 1300],
                ['WHS', 'Warehouse Supervisor', 'Receipts, stock control, and supplier coordination.', 450, 850],
                ['CSH', 'Cashier', 'Customer sales and point-of-sale operations.', 350, 650],
                ['ACC', 'Accountant', 'Purchasing review, reporting, and commission oversight.', 500, 900],
            ], fn ($r) => ['role_code' => $r[0], 'role_name' => $r[1], 'description' => $r[2], 'default_salary_min' => $r[3], 'default_salary_max' => $r[4]]);
            $departments = $this->upsert(Department::class, 'department_code', [
                ['MGT', 'Management', 'Business leadership and planning.'], ['OPS', 'Operations', 'Purchasing, inventory, and warehouse operations.'],
                ['SAL', 'Sales', 'Retail and customer account sales.'], ['FIN', 'Finance', 'Accounting, controls, and reporting.'],
            ], fn ($r) => ['department_code' => $r[0], 'department_name' => $r[1], 'description' => $r[2]]);
            $users = $this->users($roles, $departments);
            $categories = $this->upsert(Category::class, 'category_code', [
                ['LAP', 'Laptops & PCs', 'Business laptops and desktop computing.'], ['PER', 'Displays & Peripherals', 'Monitors and everyday computer accessories.'],
                ['NET', 'Networking', 'Routers, switches, access points, and cabling.'], ['MOB', 'Mobile Accessories', 'Charging and mobile-device accessories.'],
                ['PRN', 'Printing & Imaging', 'Printers, toner, and printing consumables.'], ['OFF', 'Office Supplies', 'Paper, notebooks, and counter supplies.'],
                ['PWR', 'Power & Storage', 'UPS units and data storage products.'], ['SEC', 'Security & CCTV', 'Cameras and small-business security equipment.'],
            ], fn ($r) => ['category_code' => $r[0], 'category_name' => $r[1], 'description' => $r[2]]);
            $suppliers = $this->suppliers();
            $customers = $this->customers();
            $products = $this->products($categories);
            $this->purchases($suppliers, $users, $products);
            $this->sales($customers, $users, $products);
            Setting::firstOrCreate(['key' => 'company_name'], ['value' => 'Mekong Office & Technology Supply']);
            Setting::firstOrCreate(['key' => 'currency'], ['value' => 'USD']);
        });
    }

    private function upsert(string $model, string $key, array $rows, callable $map): array
    {
        $result = [];
        foreach ($rows as $row) {
            $attributes = $map($row);
            $result[$attributes[$key]] = $model::updateOrCreate([$key => $attributes[$key]], $attributes);
        }

        return $result;
    }

    private function users(array $roles, array $departments): array
    {
        // Development-only accounts; password is DemoInventory2026! (documented in SEEDING.md).
        $rows = [
            ['EMP-001', 'Sokha Chan', 'sokha.chan@mekongoffice.demo', '012 555 101', 'ADM', 'MGT', 1250, '2023-02-15', '1988-04-12', 'Chamkarmon, Phnom Penh', null],
            ['EMP-002', 'Dara Vann', 'dara.vann@mekongoffice.demo', '012 555 102', 'MGR', 'OPS', 950, '2023-06-01', '1991-09-23', 'Sen Sok, Phnom Penh', null],
            ['EMP-003', 'Sreynich Lim', 'sreynich.lim@mekongoffice.demo', '012 555 103', 'WHS', 'OPS', 620, '2024-01-08', '1995-07-05', 'Tuol Kork, Phnom Penh', null],
            ['EMP-004', 'Rithy Keo', 'rithy.keo@mekongoffice.demo', '012 555 104', 'CSH', 'SAL', 480, '2024-04-22', '1998-11-18', 'Mean Chey, Phnom Penh', 1.50],
            ['EMP-005', 'Malis Phan', 'malis.phan@mekongoffice.demo', '012 555 105', 'ACC', 'FIN', 720, '2023-09-11', '1993-02-27', 'Daun Penh, Phnom Penh', null],
            ['EMP-006', 'San Tin', 'santinoeurn0601@gmail.com', '071 555 105', 'ADM', 'FIN', 720, '2023-09-11', '1993-02-27', 'Daun Penh, Phnom Penh', null],
        ];
        $result = [];
        foreach ($rows as $r) {
            $user = User::firstOrCreate(['user_code' => $r[0]], [
                'user_code' => $r[0], 'name' => $r[1], 'email' => $r[2], 'password' => Hash::make('DemoInventory2026!'), 'phone' => $r[3], 'status' => 'Active',
                'role_id' => $roles[$r[4]]->role_id, 'department_id' => $departments[$r[5]]->department_id, 'salary' => $r[6], 'hire_date' => $r[7], 'date_of_birth' => $r[8], 'address' => $r[9], 'commission_rate' => $r[10],
            ]);
            // commission_rate is intentionally guarded on User, so set this
            // limited payroll field explicitly for the demo cashier.
            if ($user->commission_rate != $r[10]) {
                $user->forceFill(['commission_rate' => $r[10]])->save();
            }
            $result[$r[2]] = $user;
        }

        return $result;
    }

    private function suppliers(): array
    {
        $rows = [
            ['SUP-ANGKOR', 'Angkor Computer Center Co., Ltd.', 'Vicheka Sorn', '023 880 210', 'sales@angkorcomputer.demo', 'Street 271, Tuol Kork, Phnom Penh'],
            ['SUP-KHMER', 'Khmer Digital Solutions', 'Sophea Nhem', '023 880 211', 'orders@khmerdigital.demo', 'Monivong Boulevard, Phnom Penh'],
            ['SUP-MEKONG', 'Mekong Network Supply', 'Bora Tep', '023 880 212', 'trade@mekongnetwork.demo', 'Russian Federation Boulevard, Phnom Penh'],
            ['SUP-PHNOM', 'Phnom Penh Office Mart', 'Sokunthea Yim', '023 880 213', 'wholesale@ppofficemart.demo', 'Street 214, Daun Penh, Phnom Penh'],
            ['SUP-CAMBODIA', 'Cambodia Print Care', 'Dalin Chea', '023 880 214', 'service@printcare.demo', 'Mao Tse Tung Boulevard, Phnom Penh'],
            ['SUP-LOTUS', 'Lotus Mobile Accessories', 'Kimsan Ly', '023 880 215', 'sales@lotusmobile.demo', 'Street 110, Phnom Penh'],
            ['SUP-SIEM', 'Siem Reap Tech Distribution', 'Ratha Chhum', '063 880 216', 'b2b@srtech.demo', 'National Road 6, Siem Reap'],
            ['SUP-TONLE', 'Tonle Storage & Power', 'Srey Mom', '023 880 217', 'orders@tonlestorage.demo', 'Street 2004, Sen Sok, Phnom Penh'],
            ['SUP-BAYON', 'Bayon Security Systems', 'Piseth Chhay', '023 880 218', 'projects@bayonsecurity.demo', 'Street 598, Phnom Penh'],
            ['SUP-CARDAMOM', 'Cardamom Business Supplies', 'Veasna Ouk', '023 880 219', 'trade@cardamomsupplies.demo', 'Preah Monireth Boulevard, Phnom Penh'],
        ];

        return $this->upsert(Supplier::class, 'supplier_code', $rows, fn ($r) => ['supplier_code' => $r[0], 'supplier_name' => $r[1], 'contact_person' => $r[2], 'phone' => $r[3], 'email' => $r[4], 'address' => $r[5]]);
    }

    private function customers(): array
    {
        $rows = [
            ['CUS-001', 'Sovan Reach', '010 771 201', 'sovan.reach@example.demo', 'Boeung Keng Kang, Phnom Penh'], ['CUS-002', 'Kampuchea Coffee Roasters', '023 771 202', 'office@kampucheacoffee.demo', 'Street 240, Phnom Penh'],
            ['CUS-003', 'Bright Future Academy', '023 771 203', 'admin@brightfuture.demo', 'Sangkat Phnom Penh Thmei, Phnom Penh'], ['CUS-004', 'Sopheak Interior Design', '012 771 204', 'sopheak@interior.demo', 'Toul Tom Poung, Phnom Penh'],
            ['CUS-005', 'Malis Boutique Hotel', '063 771 205', 'manager@malisboutique.demo', 'Wat Bo Road, Siem Reap'], ['CUS-006', 'Chenda Legal Services', '023 771 206', 'contact@chendalegal.demo', 'Khan 7 Makara, Phnom Penh'],
        ];

        return $this->upsert(Customer::class, 'customer_code', $rows, fn ($r) => ['customer_code' => $r[0], 'customer_name' => $r[1], 'phone' => $r[2], 'email' => $r[3], 'address' => $r[4]]);
    }

    private function products(array $categories): array
    {
        $rows = [
            ['LAP-LEN-V15', 'LAP', 'Lenovo V15 Gen 4 Laptop', 589, 510, 2, 'unit'], ['PER-LOG-M185', 'PER', 'Logitech M185 Wireless Mouse', 16.50, 11.20, 15, 'unit'], ['PER-LOG-K120', 'PER', 'Logitech K120 USB Keyboard', 18, 12.50, 8, 'unit'],
            ['PER-DEL-P2422H', 'PER', 'Dell P2422H 24-inch Monitor', 189, 155, 3, 'unit'], ['PER-LOG-H390', 'PER', 'Logitech H390 USB Headset', 34, 24, 6, 'unit'], ['PER-LOG-C270', 'PER', 'Logitech C270 HD Webcam', 39, 29, 4, 'unit'],
            ['NET-TP-AX23', 'NET', 'TP-Link Archer AX23 Wi-Fi 6 Router', 69, 50, 5, 'unit'], ['NET-TP-SG1016', 'NET', 'TP-Link TL-SG1016D 16-Port Switch', 78, 61, 10, 'unit'], ['NET-CAT6-305', 'NET', 'Cat6 UTP Network Cable 305m', 96, 72, 12, 'box'], ['NET-TP-EAP610', 'NET', 'TP-Link Omada EAP610 Access Point', 118, 91, 4, 'unit'],
            ['MOB-ANK-10K', 'MOB', 'Anker PowerCore 10000mAh Power Bank', 29, 20, 8, 'unit'], ['MOB-ANK-20W', 'MOB', 'Anker 20W USB-C Charger', 22, 15, 12, 'unit'], ['MOB-UGR-C100', 'MOB', 'UGREEN USB-C to USB-C Cable 1m', 8.50, 4.80, 20, 'unit'],
            ['PRN-HP-4003', 'PRN', 'HP LaserJet Pro 4003dw Printer', 329, 278, 2, 'unit'], ['PRN-HP-135A', 'PRN', 'HP 135A Black Laser Toner', 62, 45, 8, 'cartridge'], ['PRN-CAN-054', 'PRN', 'Canon 054 Cyan Toner Cartridge', 74, 56, 6, 'cartridge'],
            ['OFF-A4-80G', 'OFF', 'Double A A4 Copy Paper 80gsm', 5.80, 4.10, 15, 'ream'], ['OFF-IDEA-A5', 'OFF', 'Idea A5 Spiral Notebook', 2.20, 1.35, 20, 'unit'], ['PWR-SAM-1TB', 'PWR', 'Samsung T7 1TB Portable SSD', 109, 84, 5, 'unit'], ['PWR-SAN-64G', 'PWR', 'SanDisk 64GB USB 3.0 Flash Drive', 9.50, 5.75, 15, 'unit'],
            ['PWR-APC-650', 'PWR', 'APC Back-UPS 650VA', 79, 60, 3, 'unit'], ['SEC-DAH-2MP', 'SEC', 'Dahua 2MP Indoor CCTV Camera', 32, 23, 4, 'unit'], ['SEC-DAH-NVR4', 'SEC', 'Dahua 4-Channel NVR', 115, 88, 2, 'unit'], ['OFF-ZEBRA-LS2208', 'OFF', 'Zebra LS2208 Barcode Scanner', 89, 67, 5, 'unit'], ['OFF-THERM-80', 'OFF', '80mm Thermal Receipt Paper Roll', 1.15, 0.65, 15, 'roll'],
        ];
        $result = [];
        foreach ($rows as $r) {
            $result[$r[0]] = Product::firstOrCreate(['product_code' => $r[0]], ['category_id' => $categories[$r[1]]->category_id, 'product_name' => $r[2], 'unit_price' => $r[3], 'cost_price' => $r[4], 'reorder_level' => $r[5], 'unit' => $r[6]]);
        }

        return $result;
    }

    private function purchases(array $suppliers, array $users, array $products): void
    {
        $docs = [
            ['PC-26001', '2026-07-14', 'SUP-ANGKOR', [['LAP-LEN-V15', 6], ['PER-DEL-P2422H', 12]]], ['PC-26002', '2026-07-16', 'SUP-KHMER', [['PER-LOG-M185', 60], ['PER-LOG-K120', 30]]], ['PC-26003', '2026-07-18', 'SUP-KHMER', [['PER-LOG-H390', 25], ['PER-LOG-C270', 15]]],
            ['PC-26004', '2026-07-21', 'SUP-MEKONG', [['NET-TP-AX23', 20], ['NET-TP-SG1016', 10]]], ['PC-26005', '2026-07-24', 'SUP-MEKONG', [['NET-CAT6-305', 100], ['NET-TP-EAP610', 12]]], ['PC-26006', '2026-07-28', 'SUP-LOTUS', [['MOB-ANK-10K', 25], ['MOB-ANK-20W', 40]]],
            ['PC-26007', '2026-08-01', 'SUP-LOTUS', [['MOB-UGR-C100', 80]]], ['PC-26008', '2026-08-04', 'SUP-CAMBODIA', [['PRN-HP-4003', 6], ['PRN-HP-135A', 30]]], ['PC-26009', '2026-08-07', 'SUP-CAMBODIA', [['PRN-CAN-054', 20]]],
            ['PC-26010', '2026-08-11', 'SUP-PHNOM', [['OFF-A4-80G', 50], ['OFF-IDEA-A5', 60]]], ['PC-26011', '2026-08-15', 'SUP-TONLE', [['PWR-SAM-1TB', 20], ['PWR-SAN-64G', 50]]], ['PC-26012', '2026-08-19', 'SUP-TONLE', [['PWR-APC-650', 8]]],
            ['PC-26013', '2026-08-23', 'SUP-BAYON', [['SEC-DAH-2MP', 8], ['SEC-DAH-NVR4', 5]]], ['PC-26014', '2026-08-27', 'SUP-CARDAMOM', [['OFF-ZEBRA-LS2208', 5], ['OFF-THERM-80', 40]]], ['PC-26015', '2026-09-01', 'SUP-SIEM', [['NET-TP-EAP610', 3]]],
            ['PC-26016', '2026-09-05', 'SUP-PHNOM', [['OFF-A4-80G', 20]], 'Pending'], ['PC-26017', '2026-09-07', 'SUP-CAMBODIA', [['PRN-HP-135A', 12]], 'Pending'], ['PC-26018', '2026-09-09', 'SUP-MEKONG', [['NET-TP-SG1016', 4]], 'Cancelled'],
        ];
        foreach ($docs as $doc) {
            [$code,$date,$supplierCode,$lines] = $doc;
            $status = $doc[4] ?? 'Received';
            $purchase = Purchase::firstOrCreate(['purchase_code' => $code], ['supplier_id' => $suppliers[$supplierCode]->supplier_id, 'user_id' => $users['sreynich.lim@mekongoffice.demo']->user_id, 'purchase_date' => $date, 'status' => $status, 'total_amount' => 0]);
            if (! $purchase->wasRecentlyCreated) {
                continue;
            }
            foreach ($lines as [$productCode,$quantity]) {
                $product = $products[$productCode];
                PurchaseDetail::create(['purchase_id' => $purchase->purchase_id, 'product_id' => $product->product_id, 'quantity' => $quantity, 'unit_cost' => $product->cost_price, 'subtotal' => $quantity * $product->cost_price]);
                if ($status === 'Received') {
                    Product::whereKey($product->product_id)->increment('quantity_in_stock', $quantity);
                }
            }
        }
    }

    private function sales(array $customers, array $users, array $products): void
    {
        $docs = [
            ['SL-26001', '2026-08-03', 'CUS-001', [['LAP-LEN-V15', 1]], 'Cash', 'Completed', 0], ['SL-26002', '2026-08-06', 'CUS-002', [['PER-LOG-M185', 8], ['PER-DEL-P2422H', 2]], 'Bank Transfer', 'Completed', 12], ['SL-26003', '2026-08-10', 'CUS-003', [['NET-TP-AX23', 2]], 'Bank Transfer', 'Completed', 0],
            ['SL-26004', '2026-08-14', 'CUS-004', [['NET-CAT6-305', 10]], 'Cash', 'Completed', 15], ['SL-26005', '2026-08-18', 'CUS-005', [['MOB-ANK-10K', 2], ['MOB-ANK-20W', 5]], 'Card', 'Completed', 0], ['SL-26006', '2026-08-22', 'CUS-006', [['PRN-HP-4003', 3]], 'Bank Transfer', 'Completed', 25],
            ['SL-26007', '2026-08-26', 'CUS-002', [['PRN-HP-135A', 5]], 'Bank Transfer', 'Completed', 0], ['SL-26008', '2026-08-30', 'CUS-003', [['OFF-A4-80G', 10]], 'Mobile Payment', 'Completed', 0], ['SL-26009', '2026-09-03', 'CUS-004', [['PWR-SAM-1TB', 2]], 'Card', 'Completed', 5],
            ['SL-26010', '2026-09-08', 'CUS-005', [['SEC-DAH-NVR4', 3]], 'Bank Transfer', 'Completed', 0], ['SL-26011', '2026-09-09', 'CUS-001', [['PER-LOG-K120', 2]], 'Cash', 'Cancelled', 0], ['SL-26012', '2026-09-10', 'CUS-006', [['PER-LOG-H390', 1]], 'Card', 'Refunded', 0],
        ];
        foreach ($docs as [$code,$date,$customerCode,$lines,$payment,$status,$discount]) {
            $customer = $customers[$customerCode];
            $subtotal = collect($lines)->sum(fn ($l) => $products[$l[0]]->unit_price * $l[1]);
            $sale = Sale::firstOrCreate(['sale_code' => $code], ['user_id' => $users['rithy.keo@mekongoffice.demo']->user_id, 'customer_id' => $customer->customer_id, 'customer_name' => $customer->customer_name, 'sale_date' => $date, 'payment_method' => $payment, 'status' => $status, 'discount_amount' => $discount, 'total_amount' => $subtotal - $discount]);
            if (! $sale->wasRecentlyCreated) {
                continue;
            }
            foreach ($lines as [$productCode,$quantity]) {
                $product = $products[$productCode];
                SaleDetail::create(['sale_id' => $sale->sale_id, 'product_id' => $product->product_id, 'quantity' => $quantity, 'unit_price' => $product->unit_price, 'subtotal' => $quantity * $product->unit_price]);
                if ($status === 'Completed') {
                    Product::whereKey($product->product_id)->decrement('quantity_in_stock', $quantity);
                }
            }
        }
    }
}
