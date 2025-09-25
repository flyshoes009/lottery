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
        global.lotteryState = {
            drawnNumbers: [],
            participants: []
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: '抽签已重置'
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