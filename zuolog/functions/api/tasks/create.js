// 创建任务
import { jsonResponse } from '../../_middleware.js';

export async function onRequestPost(context) {
    const { request, env, data } = context;
    const userId = data.user.userId;
    
    try {
        const body = await request.json();
        const {
            title,
            time,
            spaceType,
            taskType,
            source,
            repeat,
            days,
            permanent
        } = body;
        
        if (!title || !spaceType || !taskType) {
            return jsonResponse({ error: 'Title, spaceType and taskType required' }, 400);
        }
        
        const result = await env.DB.prepare(
            `INSERT INTO tasks 
             (user_id, title, time, space_type, task_type, source, repeat, days, permanent) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            userId,
            title,
            time || null,
            spaceType,
            taskType,
            source || null,
            repeat ? 1 : 0,
            days || null,
            permanent ? 1 : 0
        ).run();
        
        return jsonResponse({
            success: true,
            taskId: result.meta?.last_row_id
        });
        
    } catch (error) {
        console.error('Create task error:', error);
        return jsonResponse({ error: 'Failed to create task' }, 500);
    }
}
