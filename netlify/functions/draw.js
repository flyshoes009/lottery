// 使用Firebase Realtime Database实现数据持久化
// Netlify Functions作为代理访问Firebase，解决国内访问限制

// Firebase配置 - 使用您的Firebase项目URL
const FIREBASE_URL = 'https://lottery-system-a0809-default-rtdb.asia-southeast1.firebasedatabase.app';
const DATABASE_PATH = '/lottery-state.json';

// 读取状态（从Firebase）
async function readState() {
    try {
        console.log('正在从Firebase读取状态...');
        const response = await fetch(`${FIREBASE_URL}${DATABASE_PATH}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object' && data.drawnNumbers) {
                console.log('从Firebase成功读取状态:', {
                    drawnCount: data.drawnNumbers.length,
                    participantCount: data.participants ? data.participants.length : 0,
                    lastUpdate: data.lastUpdate
                });
                return data;
            } else if (data === null) {
                console.log('Firebase数据为空，返回初始状态');
            }
        } else {
            console.error('Firebase响应错误:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('读取Firebase状态失败:', error);
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

// 保存状态（到Firebase）
async function saveState(state) {
    try {
        console.log('正在保存状态到Firebase...');
        
        // 添加时间戳和版本信息
        const stateToSave = {
            ...state,
            lastUpdate: new Date().toISOString(),
            version: (state.version || 0) + 1
        };
        
        const response = await fetch(`${FIREBASE_URL}${DATABASE_PATH}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stateToSave)
        });
        
        if (response.ok) {
            console.log('状态已成功保存到Firebase:', {
                version: stateToSave.version,
                drawnCount: stateToSave.drawnNumbers.length,
                participantCount: stateToSave.participants.length,
                timestamp: stateToSave.lastUpdate
            });
            return true;
        } else {
            console.error('保存到Firebase失败:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('保存状态到Firebase出错:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    console.log('Draw function called:', event.httpMethod);
    
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
        console.log('Request body:', event.body);
        const { classNumber } = JSON.parse(event.body || '{}');
        
        // 验证班级号
        if (!classNumber || classNumber.trim() === '') {
            console.log('Class number validation failed');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: '班级号不能为空' 
                })
            };
        }
        
        // 读取当前状态
        const currentState = await readState();
        console.log('Current state:', currentState);
        
        // 检查是否已满
        if (currentState.drawnNumbers && currentState.drawnNumbers.length >= 23) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '所有号码已被抽完'
                })
            };
        }
        
        // 初始化数据结构
        if (!currentState.drawnNumbers) currentState.drawnNumbers = [];
        if (!currentState.participants) currentState.participants = [];
        
        // 生成可用号码列表
        const availableNumbers = [];
        for (let i = 1; i <= 23; i++) {
            if (!currentState.drawnNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }
        
        console.log('Available numbers:', availableNumbers);
        
        // 随机选择一个号码
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        const timestamp = new Date().toISOString();
        
        console.log('Drawn number:', drawnNumber);
        
        // 更新状态
        currentState.drawnNumbers.push(drawnNumber);
        currentState.participants.push({
            classNumber: classNumber.trim(),
            number: drawnNumber,
            timestamp: timestamp
        });
        
        // 保存状态
        const saved = await saveState(currentState);
        
        console.log('Draw successful, save result:', saved);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                number: drawnNumber,
                classNumber: classNumber.trim(),
                timestamp: timestamp,
                saved: saved
            })
        };
        
    } catch (error) {
        console.error('抽签错误:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误: ' + error.message,
                error: error.toString()
            })
        };
    }
};