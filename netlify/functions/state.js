const { Store } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    // 只允许GET请求
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }
    
    try {
        // 使用Netlify Blobs获取当前状态
        const store = new Store('lottery-data');
        
        let currentState;
        try {
            const stateData = await store.get('current-state');
            currentState = stateData ? JSON.parse(stateData) : {
                drawnNumbers: [],
                participants: []
            };
        } catch (error) {
            currentState = {
                drawnNumbers: [],
                participants: []
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                state: currentState
            })
        };
        
    } catch (error) {
        console.error('获取状态错误:', error);
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