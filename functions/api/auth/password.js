// 修改管理员密码（需认证）
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPut(context) {
    const { request, env } = context;
    const user = context.data?.user;
    
    if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    
    try {
        const { oldPassword, newPassword } = await request.json();
        
        if (!oldPassword || !newPassword) {
            return jsonResponse({ error: 'Old and new password required' }, 400);
        }
        
        if (newPassword.length < 6) {
            return jsonResponse({ error: 'New password must be at least 6 characters' }, 400);
        }
        
        // 查找当前管理员
        const admin = await env.DB.prepare(
            'SELECT id, password_hash FROM admins WHERE id = ?'
        ).bind(user.userId).first();
        
        if (!admin) {
            return jsonResponse({ error: 'User not found' }, 404);
        }
        
        // 验证旧密码
        const encoder = new TextEncoder();
        const oldData = encoder.encode(oldPassword);
        const oldHashBuffer = await crypto.subtle.digest('SHA-256', oldData);
        const oldPasswordHash = Array.from(new Uint8Array(oldHashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        if (oldPasswordHash !== admin.password_hash) {
            return jsonResponse({ error: 'Old password is incorrect' }, 401);
        }
        
        // 更新为新密码
        const newData = encoder.encode(newPassword);
        const newHashBuffer = await crypto.subtle.digest('SHA-256', newData);
        const newPasswordHash = Array.from(new Uint8Array(newHashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        await env.DB.prepare(
            'UPDATE admins SET password_hash = ? WHERE id = ?'
        ).bind(newPasswordHash, user.userId).run();
        
        return jsonResponse({ success: true, message: 'Password updated' });
        
    } catch (error) {
        console.error('Password update error:', error);
        return jsonResponse({ error: 'Failed to update password' }, 500);
    }
}
