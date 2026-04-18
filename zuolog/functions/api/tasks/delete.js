// 删除任务
import { jsonResponse } from '../../_middleware.js';

export async function onRequestDelete(context) {
    const { env, data } = context;
    const userId = data.user.userId;
    
    try {
        const url = new URL(context.request.url);
        const taskId = url.pathname.split('/').pop();
        
        // 验证任务所有权并删除
        const result = await env.DB.prepare(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?'
        ).bind(taskId, userId).run();
        
        if (result.meta?.changes === 0) {
            return jsonResponse({ error: 'Task not found' }, 404);
        }
        
        return jsonResponse({ success: true });
        
    } catch (error) {
        console.error('Delete task error:', error);
        return jsonResponse({ error: 'Failed to delete task' }, 500);
    }
}
