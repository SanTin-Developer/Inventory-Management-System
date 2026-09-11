// src/utils/extractPaginated.js
export function extractPaginated(response) {
  const body = response?.data;

  // Case 1: double-wrapped — { data: { data: [...], current_page, ... } }
  if (body?.data?.data !== undefined) {
    return {
      items: body.data.data ?? [],
      meta: {
        current_page: body.data.current_page ?? 1,
        last_page: body.data.last_page ?? 1,
        total: body.data.total ?? 0,
      },
    };
  }

  // Case 2: single-wrapped — { data: [...], current_page, ... } (raw paginator)
  if (Array.isArray(body?.data)) {
    return {
      items: body.data ?? [],
      meta: {
        current_page: body.current_page ?? 1,
        last_page: body.last_page ?? 1,
        total: body.total ?? 0,
      },
    };
  }

  // Fallback — plain array with no pagination at all
  return {
    items: Array.isArray(body) ? body : [],
    meta: { current_page: 1, last_page: 1, total: body?.length ?? 0 },
  };
}