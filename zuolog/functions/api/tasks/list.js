// 获取任务列表
import { jsonResponse } from '../../_middleware.js';

export async function onRequestGet(context) {
    const { env, data } = context;
    const userId = data.user.userId;
    
    try {
        const url = new URL(context.request.url);
        const spaceType = url.searchParams.get('space') || 'do';
        
        // 获取所有任务，按类型分组
        const tasks = await env.DB.prepare(
            `SELECT * FROM tasks 
             WHERE user_id = ? AND space_type = ?
             ORDER BY sort_order ASC, created_at DESC`
        ).bind(userId, spaceType).all();
        
        // 按 task_type 分组
        const grouped = {
            do: [],
            notDo: {
                pending: [],
                abstinence: [],
                folded: []
            }
        };
        
        if (spaceType === 'do') {
            grouped.do = tasks.results || [];
        } else {
            const results = tasks.results || [];
            grouped.notDo.pending = results.filter(t => t.task_type === 'invite');
            grouped.notDo.abstinence = results.filter(t => t.task_type === 'abstinence');
            grouped.notDo.folded = results.filter(t => t.task_type === 'folded');
        }
        
        return jsonResponse({
            success: true,
            data: grouped
        });
        
    } catch (error) {
        console.error('List tasks error:', error);
        return jsonResponse({ error: 'Failed to fetch tasks' }, 500);
    }
}
