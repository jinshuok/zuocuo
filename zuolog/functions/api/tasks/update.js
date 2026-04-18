// 更新任务
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPut(context) {
    const { request, env, data } = context;
    const userId = data.user.userId;
    
    try {
        const url = new URL(request.url);
        const taskId = url.pathname.split('/').pop();
        const body = await request.json();
        
        // 验证任务所有权
        const existing = await env.DB.prepare(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ?'
        ).bind(taskId, userId).first();
        
        if (!existing) {
            return jsonResponse({ error: 'Task not found' }, 404);
        }
        
        // 构建更新语句
        const updates = [];
        const values = [];
        
        if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
        if (body.time !== undefined) { updates.push('time = ?'); values.push(body.time); }
        if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
        if (body.spaceType !== undefined) { updates.push('space_type = ?'); values.push(body.spaceType); }
        if (body.taskType !== undefined) { updates.push('task_type = ?'); values.push(body.taskType); }
        if (body.repeat !== undefined) { updates.push('repeat = ?'); values.push(body.repeat ? 1 : 0); }
        if (body.days !== undefined) { updates.push('days = ?'); values.push(body.days); }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(taskId, userId);
        
        await env.DB.prepare(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
        ).bind(...values).run();
        
        return jsonResponse({ success: true });
        
    } catch (error) {
        console.error('Update task error:', error);
        return jsonResponse({ error: 'Failed to update task' }, 500);
    }
}
