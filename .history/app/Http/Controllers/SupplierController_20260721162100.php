<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use Exception;

class SupplierController extends Controller
{
    // Get all suppliers
    public function index(Request $request)
    {
        $keyword = $request->search;

        $suppliers = Supplier::query()
            ->when($keyword, function ($query) use ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('supplier_name', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%");
                });
            })
            ->orderBy('supplier_id', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($suppliers);
    }

    // Create supplier
    public function store(StoreSupplierRequest $request)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $needsGeneratedCode = empty($validated['supplier_code']);

            if ($needsGeneratedCode) {
                $validated['supplier_code'] = 'TMP-' . uniqid();
            }

            $supplier = Supplier::create($request->validated());

            if ($needsGeneratedCode){
                $supplier -> su
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Supplier created successfully.',
                'data' => $supplier
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Show supplier
    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    // Update supplier
    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        DB::beginTransaction();

        try {

            $supplier->update($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully.',
                'data' => $supplier
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete supplier
    public function destroy(Supplier $supplier)
    {
        try {

            $supplier->delete();

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully.'
            ]);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Supplier cannot be deleted because it has products.'
            ], 500);
        }
    }
}
