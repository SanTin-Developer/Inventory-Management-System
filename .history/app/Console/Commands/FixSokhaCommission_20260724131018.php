<?php

namespace App\Console\Commands;

use App\Services\CommissionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixSokhaCommission extends Command
{
    protected $signature = 'fix:sokha-commission';
    protected $description = 'Fix commission_rate and recalculate commissions for Sokha Chan';

    public function handle(CommissionService $commissionService)
    {
        $this->info('Step 1: Checking current commission_rate...');
        $before = DB::table('users')->where('user_id', 125)->first();
        $this->info("Before: rate = {$before->commission_rate}");

        $this->info('Step 2: Updating commission_rate to 5...');
        try {
            $affected = DB::table('users')->where('user_id', 125)->update(['commission_rate' => 5]);
            $this->info("Rows affected: {$affected}");
        } catch (\Throwable $e) {
            $this->error('UPDATE FAILED: ' . $e->getMessage());
            return 1;
        }

        $after = DB::table('users')->where('user_id', 125)->first();
        $this->info("After: rate = {$after->commission_rate}");

        $this->info('Step 3: Deleting old $0 commission records...');
        try {
            $deleted = DB::table('commissions')->where('user_id', 125)->where('commission_amount', 0)->delete();
            $this->info("Rows deleted: {$deleted}");
        } catch (\Throwable $e) {
            $this->error('DELETE FAILED: ' . $e->getMessage());
            return 1;
        }

        $this->info('Step 4: Recalculating commissions for sales 167, 168, 169...');
        foreach ([167, 168, 169] as $saleId) {
            try {
                $result = $commissionService->calculateForSale($saleId);
                $this->info("Sale {$saleId}: " . json_encode($result));
            } catch (\Throwable $e) {
                $this->error("Sale {$saleId} FAILED: " . $e->getMessage());
            }
        }

        $this->info('Done.');
        return 0;
    }
}
