export default [
    "strapi::logger",
    "strapi::errors",
    "strapi::security",
    {
        name: "strapi::cors",
        config: {
            origin: [process.env.ADMIN_PATH || "http://localhost/"],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            headers: ["Content-Type", "Authorization"],
            credentials: true,
        },
    },
    "strapi::poweredBy",
    "strapi::query",
    "strapi::body",
    "strapi::session",
    "strapi::favicon",
    "strapi::public",
]
