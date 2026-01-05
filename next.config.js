const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: false,
    workboxOptions: {
        disableDevLogs: true,
        skipWaiting: process.env.NODE_ENV === "production",
        clientsClaim: process.env.NODE_ENV === "production",
        cleanupOutdatedCaches: process.env.NODE_ENV === "production",
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    // other config options here
};

module.exports = withPWA(nextConfig);