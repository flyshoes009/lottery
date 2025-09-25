// 使用简单的HTTP API存储服务
// 解决多人多浏览器数据持久性问题

// 使用jsonbox.io作为免费在线JSON存储
const STORAGE_URL = 'https://jsonbox.io/box_lottery_12345';

// 读取状态
async function readState() {
    try {
        const response = await fetch(`${STORAGE_URL}/state`);
        if (response.ok) {
            const data = await response.json();
            // jsonbox 返回数组，取最新的记录
            if (Array.isArray(data) && data.length > 0) {
                return data[data.length - 1];
            }
        }
        
        // 返回默认状态
        return { drawnNumbers: [], participants: [] };
    } catch (error) {
        console.error('Error reading state:', error);
        return { drawnNumbers: [], participants: [] };
    }
}

exports.handler = async (event, context) => {
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    
    // 只允许GET请求
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }
    
    try {
        // 读取当前状态
        const currentState = await readState();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                state: currentState
            })
        };
        
    } catch (error) {
        console.error('获取状态错误:', error);
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