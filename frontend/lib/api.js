import { loadSession } from './session';

export class ApiError extends Error {
    constructor(status, message, fields) {
        super(message);
        this.status = status;
        // field name -> message, filled for bean validation errors
        this.fields = fields || null;
    }
}

const UNREACHABLE = 'Cannot reach the server. Is the Spring Boot backend running on port 8080?';

// Calls the Spring Boot API under /api/v1 (proxied by next.config.mjs) with the user's token.
export async function api(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const session = loadSession();
    if (session) headers.Authorization = 'Bearer ' + session.accessToken;

    let response;
    try {
        response = await fetch('/api/v1' + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            cache: 'no-store'
        });
    } catch {
        throw new ApiError(0, UNREACHABLE);
    }

    const text = await response.text();
    let data = text;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // plain text response
    }

    if (response.ok) return data;

    if (response.status === 401 && session && !path.startsWith('/auth/')) {
        window.dispatchEvent(new Event('auth:expired'));
        throw new ApiError(401, 'Your session has expired. Please log in again.');
    }

    throw toApiError(response.status, data);
}

function toApiError(status, data) {
    if (data && typeof data === 'object') {
        // ErrorDetails from GlobalExceptionHandler, or Spring's default error body
        if (typeof data.message === 'string' && data.message) return new ApiError(status, data.message);
        if (data.error && data.timestamp) return new ApiError(status, defaultMessage(status));
        // field -> message map from bean validation
        const fields = {};
        Object.keys(data).forEach((key) => {
            if (typeof data[key] === 'string') fields[key] = data[key];
        });
        if (Object.keys(fields).length) return new ApiError(status, 'Please fix the highlighted fields.', fields);
    }
    // the Next.js proxy answers with a plain 500 when the backend is down
    if (status >= 500) return new ApiError(status, UNREACHABLE);
    if (typeof data === 'string' && data) return new ApiError(status, data);
    return new ApiError(status, defaultMessage(status));
}

function defaultMessage(status) {
    if (status === 401) return 'Please log in to continue.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 404) return 'Not found.';
    return 'Something went wrong (HTTP ' + status + ').';
}
