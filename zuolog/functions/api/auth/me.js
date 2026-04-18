// 获取当前用户信息
import { jsonResponse } from '../../_middleware.js';

export async function onRequestGet(context) {
    const { data } = context;
    
    return jsonResponse({
        success: true,
        user: data.user
    });
}
