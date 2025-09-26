// 使用Firebase Realtime Database实现数据持久化
// Netlify Functions作为代理访问Firebase，解决国内访问限制

// Firebase配置 - 使用您的Firebase项目URL
const FIREBASE_URL = 'https://lottery-system-a0809-default-rtdb.asia-southeast1.firebasedatabase.app';
const DATABASE_PATH = '/lottery-state.json';
const CONFIG_PATH = '/lottery-config.json';

// 读取配置
async function readConfig() {
    try {
        const response = await fetch(`${FIREBASE_URL}${CONFIG_PATH}`);
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object') {
                return data;
            }
        }
    } catch (error) {
        console.error('读取配置失败:', error);
    }
    return { totalNumbers: 23 };
}

// 读取状态（从Firebase）
async function readState() {
    try {
        console.log('正在从Firebase读取状态...');
        const response = await fetch(`${FIREBASE_URL}${DATABASE_PATH}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object' && data.drawnNumbers) {
                console.log('成功从Firebase获取状态:', {
                    drawnCount: data.drawnNumbers.length,
                    participantCount: data.participants ? data.participants.length : 0,
                    lastUpdate: data.lastUpdate,
                    version: data.version
                });
                return data;
            } else if (data === null) {
                console.log('Firebase数据为空，返回初始状态');
            }
        } else {
            console.error('Firebase响应错误:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('从 Firebase 读取状态失败:', error);
    }
    
    // 返回默认状态
    const defaultState = {
        drawnNumbers: [],
        participants: [],
        lastUpdate: new Date().toISOString(),
        version: 1
    };
    console.log('返回默认初始状态');
    return defaultState;
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
        // 读取当前状态和配置
        const currentState = await readState();
        const config = await readConfig();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                state: {
                    ...currentState,
                    totalNumbers: config.totalNumbers || 23
                },
                config: config
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