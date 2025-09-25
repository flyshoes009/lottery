// 使用简单的HTTP API存储服务
// 解决多人多浏览器数据持久性问题

// 使用jsonbox.io作为免费在线JSON存储
const STORAGE_URL = 'https://jsonbox.io/box_lottery_12345';

// 保存状态
async function saveState(state) {
    try {
        // 先删除旧数据
        try {
            const oldData = await fetch(`${STORAGE_URL}/state`);
            if (oldData.ok) {
                const records = await oldData.json();
                if (Array.isArray(records)) {
                    for (const record of records) {
                        if (record._id) {
                            await fetch(`${STORAGE_URL}/${record._id}`, { method: 'DELETE' });
                        }
                    }
                }
            }
        } catch (deleteError) {
            console.log('Error deleting old data:', deleteError);
        }
        
        // 保存新数据
        const response = await fetch(`${STORAGE_URL}/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error saving state:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // 处理CORS预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }
    
    try {
        const { password } = JSON.parse(event.body || '{}');
        
        // 验证密码
        if (password !== '12345678') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '密码错误'
                })
            };
        }
        
        // 重置状态
        const initialState = {
            drawnNumbers: [],
            participants: []
        };
        
        // 保存重置状态
        const saved = await saveState(initialState);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '抽签已重置',
                saved: saved
            })
        };
        
    } catch (error) {
        console.error('重置错误:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误'
            })
        };
    }
};