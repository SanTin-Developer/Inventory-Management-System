<?php

namespace App\Http\Controllers;

use App\Services\PurchaseRecommendationService;
use Illuminate\Http\JsonResponse;

class RecommendationController extends Controller
{
    public function __construct(
        private readonly PurchaseRecommendationService $recommendationService
    ) {}

    /**
     * GET /api/products/{id}/recommendation
     * Purchase recommendation for a single product.
     */
    public function show(int $id): JsonResponse
    {
        $result = $this->recommendationService->analyzeProduct($id);

        return response()->json($result);
    }

    /**
     * GET /api/recommendations
     * Purchase recommendations for every product, sorted so items
     * that need reordering now appear first.
     */
    public function index(): JsonResponse
    {
        $results = $this->recommendationService->analyzeAllProducts();

        usort($results, function ($a, $b) {
            $aNeeds = $a['needs_reorder_now'] ?? false;
            $bNeeds = $b['needs_reorder_now'] ?? false;

            return $bNeeds <=> $aNeeds;
        });

        return response()->json([
            'count' => count($results),
            'recommendations' => $results,
        ]);
    }
}
