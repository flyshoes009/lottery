// 简化版本：使用内存存储（重启会重置数据）
// 如果 Netlify Blobs 有问题，可以重命名此文件为 draw.js

// 内存存储（注意：函数重启会丢失数据）
let globalState = {
    drawnNumbers: [],
    participants: []
};

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
        
        // 检查是否已满
        if (globalState.drawnNumbers.length >= 23) {
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
            if (!globalState.drawnNumbers.includes(i)) {
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
        globalState.drawnNumbers.push(drawnNumber);
        globalState.participants.push({
            classNumber: classNumber.trim(),
            number: drawnNumber,
            timestamp: timestamp
        });
        
        console.log('Draw successful, current state:', globalState);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                number: drawnNumber,
                classNumber: classNumber.trim(),
                timestamp: timestamp
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