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

// 保存状态（到内存）
function saveState(state) {
    try {
        state.lastUpdate = new Date().toISOString();
        state.version = (global.lotteryStateData.version || 0) + 1;
        global.lotteryStateData = { ...state };
        
        console.log('重置状态已保存:', {
            version: state.version,
            drawnCount: state.drawnNumbers.length,
            participantCount: state.participants.length
        });
        
        return true;
    } catch (error) {
        console.error('保存状态失败:', error);
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
        const saved = saveState(initialState);
        
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