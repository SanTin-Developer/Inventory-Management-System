<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\Request;
use Exception;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $term = '%' . strtoupper($request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->whereRaw('UPPER(customer_name) LIKE ?', [$term])
                    ->orWhereRaw('UPPER(email) LIKE ?', [$term])
                    ->orWhereRaw('UPPER(phone) LIKE ?', [$term]);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(10);
    }

    public function store(StoreCustomerRequest $request)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();
            unset($validated['customer_code']); // never trust client-supplied code, if this column exists

            $customer = Customer::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully.',
                'data' => $customer,
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Customer $customer)
    {
        return $customer;
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $customer->update($request->validated());

        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json(['message' => 'Customer deleted.']);
    }
}
