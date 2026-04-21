// 创建轮播图（需认证）
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { title, subtitle, image_url, link_url, btn_text, btn_link, sort_order, type, items } = await request.json();
        
        if (!title || !image_url) {
            return jsonResponse({ error: 'Title and image_url are required' }, 400);
        }
        
        const bannerType = type || 'standard';
        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : '[]';
        
        const result = await env.DB.prepare(
            `INSERT INTO banners (title, subtitle, image_url, link_url, btn_text, btn_link, sort_order, type, items) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            title,
            subtitle || '',
            image_url,
            link_url || '',
            btn_text || '了解更多',
            btn_link || '',
            sort_order || 0,
            bannerType,
            itemsJson
        ).run();
        
        return jsonResponse({ 
            success: true, 
            id: result.meta?.last_row_id 
        });
        
    } catch (error) {
        console.error('Create banner error:', error);
        return jsonResponse({ error: error.message || 'Failed to create banner' }, 500);
    }
}
