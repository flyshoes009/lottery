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

// 保存状态
async function saveState(state) {
    try {
        // 先删除旧数据
        try {
            const oldData = await fetch(`${STORAGE_URL}/state`);
            if (oldData.ok) {
                const records = await oldData.json();
                if (Array.isArray(records)) {
                    for (const record of records) {
                        if (record._id) {
                            await fetch(`${STORAGE_URL}/${record._id}`, { method: 'DELETE' });
                        }
                    }
                }
            }
        } catch (deleteError) {
            console.log('Error deleting old data:', deleteError);
        }
        
        // 保存新数据
        const response = await fetch(`${STORAGE_URL}/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error saving state:', error);
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