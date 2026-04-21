// 获取轮播图列表
// 公开访问：只返回启用的
// 管理员访问（带有效 Token）：返回全部
import { verifyToken, jsonResponse } from '../../_middleware.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        const url = new URL(request.url);
        const authHeader = request.headers.get('Authorization');
        let isAdmin = false;
        
        // 尝试验证管理员身份
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const payload = await verifyToken(token, env.JWT_SECRET);
            if (payload) isAdmin = true;
        }
        
        let sql, stmt;
        if (isAdmin || url.searchParams.get('all') === '1') {
            sql = `SELECT id, title, subtitle, image_url, link_url, btn_text, btn_link, sort_order, active, type, items 
                   FROM banners 
                   ORDER BY sort_order ASC, id ASC`;
            stmt = env.DB.prepare(sql);
        } else {
            sql = `SELECT id, title, subtitle, image_url, link_url, btn_text, btn_link, sort_order, active, type, items 
                   FROM banners 
                   WHERE active = 1 
                   ORDER BY sort_order ASC, id ASC`;
            stmt = env.DB.prepare(sql);
        }
        
        const { results } = await stmt.all();
        
        // 解析 items JSON
        const banners = (results || []).map(b => {
            try {
                if (b.items && typeof b.items === 'string') {
                    b.items = JSON.parse(b.items);
                } else {
                    b.items = [];
                }
            } catch (e) {
                b.items = [];
            }
            return b;
        });
        
        return jsonResponse({ success: true, banners });
        
    } catch (error) {
        console.error('List banners error:', error);
        return jsonResponse({ error: 'Failed to fetch banners' }, 500);
    }
}
