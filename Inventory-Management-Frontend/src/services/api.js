import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "https://inventory-management-system-6xpb.onrender.com/api",
    headers: {
        Accept: "application/json",
    },
});

// ---- Lightweight GET cache ------------------------------------------------
// Several pages fetch the same resources (roles, departments, categories,
// stats) and the backend caps the whole API at 60 requests/minute/user
// (RateLimiter::for('api')). Deduping identical GETs keeps browsing well
// under that budget. Mutations clear the cache so list refreshes stay fresh.
const GET_CACHE_TTL_MS = 15_000;
const getCache = new Map();
let cacheGeneration = 0;

function stableParams(params) {
    if (!params) return "";
    return Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== "")
        .sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join("&");
}

function isGet(config) {
    return !config?.method || config.method.toLowerCase() === "get";
}

function bustCache() {
    cacheGeneration++;
    getCache.clear();
}

// Attach token to every request; drop stale GET cache on writes.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (!isGet(config)) {
        bustCache();
    }
    return config;
});

const rawGet = api.get.bind(api);

api.get = function cachedGet(url, config) {
    if (!isGet(config?.method)) {
        return rawGet(url, config);
    }

    const key = `${url}|${stableParams(config?.params)}`;
    const hit = getCache.get(key);

    // Serve a settled, still-fresh copy.
    if (hit?.ready && Date.now() - hit.ts < GET_CACHE_TTL_MS) {
        return Promise.resolve(hit.response);
    }

    // Same URL already in flight (React StrictMode double-mounts effects in
    // dev) — share the pending request instead of firing a duplicate.
    if (hit?.pending) {
        return hit.pending;
    }

    const gen = cacheGeneration;
    const pending = rawGet(url, config).then(
        (response) => {
            if (cacheGeneration === gen) {
                getCache.set(key, { ready: true, ts: Date.now(), response });
            }
            return response;
        },
        (error) => {
            if (getCache.get(key)?.pending === pending) {
                getCache.delete(key);
            }
            throw error;
        },
    );

    getCache.set(key, { ready: false, pending });
    return pending;
};

// Handle auth-expiry (401) only. No automatic 429 retry: the backend counts
// every request against the 60/minute budget, so retrying throttled calls
// only exhausts the window faster.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    },
);

export default api;