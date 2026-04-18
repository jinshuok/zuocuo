// JWT 认证中间件

// 验证 JWT Token
async function verifyToken(token, secret) {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) return null;
        
        const payload = JSON.parse(atob(payloadB64));
        
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return null;
        }
        
        // 使用 Web Crypto API 验证签名
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify(
            'HMAC', key, signature,
            encoder.encode(`${headerB64}.${payloadB64}`)
        );
        
        return valid ? payload : null;
    } catch (e) {
        return null;
    }
}

// 生成 JWT Token
async function signToken(payload, secret) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const body = { ...payload, iat: now, exp: now + 7 * 24 * 60 * 60 };
    
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(body)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const message = `${headerB64}.${payloadB64}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    return `${message}.${signatureB64}`;
}

// 响应辅助函数
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

// 认证中间件
export async function onRequest(context) {
    const { request, next, env } = context;
    
    // CORS 预检
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }
    
    // 公开路由
    const publicRoutes = ['/api/auth/login'];
    const url = new URL(request.url);
    if (publicRoutes.includes(url.pathname)) {
        return next();
    }
    
    // GET /api/banners/list 也是公开的
    if (url.pathname === '/api/banners/list' && request.method === 'GET') {
        return next();
    }
    
    // 静态文件不需要认证
    const pathname = url.pathname;
    if (pathname === '/' || 
        pathname.endsWith('.html') || 
        pathname.endsWith('.css') || 
        pathname.endsWith('.js') ||
        pathname.startsWith('/assets/')) {
        return next();
    }
    
    // 验证 Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.slice(7);
    const payload = await verifyToken(token, env.JWT_SECRET);
    
    if (!payload) {
        return jsonResponse({ error: 'Invalid token' }, 401);
    }
    
    context.data = { user: payload };
    
    return next();
}

export { verifyToken, signToken, jsonResponse };
