// 用户注册
import { signToken, jsonResponse } from '../../_middleware.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { username, password } = await request.json();
        
        // 验证输入
        if (!username || !password) {
            return jsonResponse({ error: 'Username and password required' }, 400);
        }
        
        if (username.length < 3 || password.length < 6) {
            return jsonResponse({ error: 'Username min 3 chars, password min 6 chars' }, 400);
        }
        
        // 检查用户名是否已存在
        const existing = await env.DB.prepare(
            'SELECT id FROM users WHERE username = ?'
        ).bind(username).first();
        
        if (existing) {
            return jsonResponse({ error: 'Username already exists' }, 409);
        }
        
        // 密码哈希（使用简单的 SHA-256，生产环境建议用 bcrypt）
        const encoder = new TextEncoder();
        const data = encoder.encode(password + username); // 简单的 salt
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const passwordHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        // 插入用户
        const result = await env.DB.prepare(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)'
        ).bind(username, passwordHash).run();
        
        const userId = result.meta?.last_row_id;
        
        // 生成 Token
        const token = await signToken({ userId, username }, env.JWT_SECRET);
        
        return jsonResponse({
            success: true,
            token,
            user: { id: userId, username }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        return jsonResponse({ error: 'Registration failed' }, 500);
    }
}
