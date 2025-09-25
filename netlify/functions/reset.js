// 使用Firebase Realtime Database实现数据持久化
// Netlify Functions作为代理访问Firebase，解决国内访问限制

// Firebase配置 - 使用您的Firebase项目URL
const FIREBASE_URL = 'https://lottery-system-a0809-default-rtdb.asia-southeast1.firebasedatabase.app';
const DATABASE_PATH = '/lottery-state.json';

// 保存状态（到Firebase）
async function saveState(state) {
    try {
        console.log('正在重置并保存状态到Firebase...');
        
        const stateToSave = {
            ...state,
            lastUpdate: new Date().toISOString(),
            version: 1 // 重置时版本号重置为1
        };
        
        const response = await fetch(`${FIREBASE_URL}${DATABASE_PATH}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stateToSave)
        });
        
        if (response.ok) {
            console.log('状态已成功重置并保存到Firebase:', {
                version: stateToSave.version,
                timestamp: stateToSave.lastUpdate
            });
            return true;
        } else {
            console.error('重置并保存到Firebase失败:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('重置状态到Firebase出错:', error);
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