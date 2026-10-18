// The Spring Boot backend. Requests to /api/* are proxied there, so the browser
// only talks to the Next.js server and no CORS setup is needed.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // do not generate an AGENTS.md file during `next dev`
    agentRules: false,
    async rewrites() {
        return [
            { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
            { source: '/swagger-ui/:path*', destination: `${BACKEND_URL}/swagger-ui/:path*` },
            { source: '/v3/api-docs/:path*', destination: `${BACKEND_URL}/v3/api-docs/:path*` }
        ];
    }
};

export default nextConfig;
