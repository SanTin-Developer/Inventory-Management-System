import api from "./api";

export const authService = {
    async login(email, password) {
        const response = await api.post("/login", { email, password });

        if (response.data.requires_2fa) {
            // Don't destructure token/user — there isn't one yet.
            // Throw a plain object so AuthContext/Login.jsx can read
            // requires_2fa + user_id directly off the caught error.
            throw { requires_2fa: true, user_id: response.data.user_id };
        }

        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        return { token, user };
    },

    async logout() {
        try {
            await api.post("/logout");
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    },

    async getCurrentUser() {
        const response = await api.get("/user");
        return response.data;
    },

    getStoredUser() {
        const user = localStorage.getItem("user");
        if (!user || user === "undefined" || user === "null") return null;
        try {
            return JSON.parse(user);
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    },

    isAuthenticated() {
        return !!localStorage.getItem("token");
    },
};