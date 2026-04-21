// 更新/删除轮播图（需认证）
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPut(context) {
    const { request, env } = context;
    const id = context.params.id;
    
    try {
        const { title, subtitle, image_url, link_url, btn_text, btn_link, sort_order, active, type, items } = await request.json();
        
        const bannerType = type || 'standard';
        const itemsJson = Array.isArray(items) ? JSON.stringify(items) : '[]';
        
        await env.DB.prepare(
            `UPDATE banners 
             SET title = ?, subtitle = ?, image_url = ?, link_url = ?, 
                 btn_text = ?, btn_link = ?, sort_order = ?, active = ?,
                 type = ?, items = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
        ).bind(
            title,
            subtitle || '',
            image_url,
            link_url || '',
            btn_text || '了解更多',
            btn_link || '',
            sort_order ?? 0,
            active ?? 1,
            bannerType,
            itemsJson,
            id
        ).run();
        
        return jsonResponse({ success: true });
        
    } catch (error) {
        console.error('Update banner error:', error);
        return jsonResponse({ error: 'Failed to update banner' }, 500);
    }
}

export async function onRequestDelete(context) {
    const { env } = context;
    const id = context.params.id;
    
    try {
        await env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true });
        
    } catch (error) {
        console.error('Delete banner error:', error);
        return jsonResponse({ error: 'Failed to delete banner' }, 500);
    }
}
