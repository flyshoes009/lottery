// 简化版本：使用全局变量存储（重启会重置数据）
// 解决 Netlify Blobs 配置问题

// 初始化全局状态
if (!global.lotteryState) {
    global.lotteryState = {
        drawnNumbers: [],
        participants: []
    };
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
        // 返回当前状态
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                state: global.lotteryState
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