// 使用GitHub仓库作为数据存储（更可靠的方案）
// 解决多人多浏览器数据持久性问题

// 如果您有GitHub账户，可以配置以下变量
const GITHUB_OWNER = 'your-github-username'; // 您的GitHub用户名
const GITHUB_REPO = 'lottery-data'; // 专门用于存储的仓库名
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // GitHub Personal Access Token
const FILE_PATH = 'lottery-state.json';

// 备用方案：使用一个公开的pastebin服务
const PASTEBIN_URL = 'https://api.paste.ee/v1/pastes';
const PASTEBIN_KEY = 'lottery_state_' + Date.now().toString(36);

// 读取状态（使用简单的HTTP存储服务）
async function readState() {
    try {
        // 使用一个简单的在线JSON存储
        const response = await fetch('https://api.npoint.io/lottery12345', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('读取到的状态:', data);
            return data;
        }
    } catch (error) {
        console.error('读取状态失败:', error);
    }
    
    // 返回默认状态
    return { drawnNumbers: [], participants: [] };
}

// 保存状态
async function saveState(state) {
    try {
        // 使用 npoint.io 更新数据
        const response = await fetch('https://api.npoint.io/lottery12345', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        
        console.log('保存状态响应:', response.status);
        return response.ok;
    } catch (error) {
        console.error('保存状态失败:', error);
        return false;
    }
}

exports.handler = async (event, context) => {
    console.log('Draw function v2 called:', event.httpMethod);
    
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
        console.log('Current state loaded:', currentState);
        
        // 初始化数据结构
        if (!currentState.drawnNumbers) currentState.drawnNumbers = [];
        if (!currentState.participants) currentState.participants = [];
        
        // 检查是否已满
        if (currentState.drawnNumbers.length >= 23) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: '所有号码已被抽完'
                })
            };
        }
        
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
                saved: saved,
                debug: {
                    totalDrawn: currentState.drawnNumbers.length,
                    available: availableNumbers.length
                }
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