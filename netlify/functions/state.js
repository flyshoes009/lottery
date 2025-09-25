// 国内友好的数据存储方案
// 优先使用内存存储，确保高性能和可靠性

// 初始化全局状态存储
if (!global.lotteryStateData) {
    global.lotteryStateData = {
        drawnNumbers: [],
        participants: [],
        lastUpdate: new Date().toISOString(),
        version: 1
    };
}

// 读取状态（从内存）
function readState() {
    const state = global.lotteryStateData;
    console.log('返回当前状态:', {
        drawnCount: state.drawnNumbers.length,
        participantCount: state.participants.length,
        lastUpdate: state.lastUpdate,
        version: state.version
    });
    return { ...state }; // 返回副本
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
        const currentState = readState();
        
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