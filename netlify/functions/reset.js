const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    // 只允许POST请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }
    
    // 处理CORS预检请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }
    
    try {
        const { password } = JSON.parse(event.body);
        
        // 验证密码
        if (password !== '12345678') {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    message: '密码错误'
                })
            };
        }
        
        // 使用Netlify Blobs重置数据
        const store = getStore('lottery-data');
        
        // 重置状态
        const initialState = {
            drawnNumbers: [],
            participants: []
        };
        
        await store.set('current-state', JSON.stringify(initialState));
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: '抽签已重置'
            })
        };
        
    } catch (error) {
        console.error('重置错误:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误'
            })
        };
    }
};