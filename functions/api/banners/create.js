// 创建轮播图（需认证）
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { title, subtitle, image_url, link_url, btn_text, btn_link, sort_order } = await request.json();
        
        if (!title || !image_url) {
            return jsonResponse({ error: 'Title and image_url are required' }, 400);
        }
        
        const result = await env.DB.prepare(
            `INSERT INTO banners (title, subtitle, image_url, link_url, btn_text, btn_link, sort_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            title,
            subtitle || '',
            image_url,
            link_url || '',
            btn_text || '了解更多',
            btn_link || '',
            sort_order || 0
        ).run();
        
        return jsonResponse({ 
            success: true, 
            id: result.meta?.last_row_id 
        });
        
    } catch (error) {
        console.error('Create banner error:', error);
        return jsonResponse({ error: 'Failed to create banner' }, 500);
    }
}
