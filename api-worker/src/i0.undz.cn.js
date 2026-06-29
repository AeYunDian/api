import { proxyStaticFile } from './utils.js';

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        let processedPath = path;
        const atIndex = processedPath.indexOf('@');
        if (atIndex === -1) {
            processedPath = processedPath + '@1e_1c.webp';
        } else {
            if (processedPath.includes('@np')) {
                processedPath = processedPath.substring(0, atIndex);
            }
        }
        const targetUrl = `${url.protocol}//i0.hdslb.com${processedPath}${url.search || ''}`;
        const response = await proxyStaticFile(targetUrl);
        if (response.status === 200 || response.status === 304) {
            const headers = new Headers(response.headers);
            if (!headers.has('Cache-Control')) {
                headers.set('Cache-Control', 'public, max-age=86400');
            }
            return new Response(response.body, { headers });
        }
        return response;
    }
};