const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    console.log('Draw function called:', event.httpMethod);
    
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
        console.log('Request body:', event.body);
        const { classNumber } = JSON.parse(event.body || '{}');
        
        // 验证班级号
        if (!classNumber || classNumber.trim() === '') {
            console.log('Class number validation failed');
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    success: false, 
                    message: '班级号不能为空' 
                })
            };
        }
        
        console.log('Initializing store...');
        // 使用Netlify Blobs作为简单的数据存储
        const store = getStore('lottery-data');
        
        // 获取当前状态
        let currentState;
        try {
            console.log('Getting current state...');
            const stateData = await store.get('current-state');
            currentState = stateData ? JSON.parse(stateData) : {
                drawnNumbers: [],
                participants: []
            };
            console.log('Current state:', currentState);
        } catch (error) {
            console.log('Error getting state, using default:', error);
            currentState = {
                drawnNumbers: [],
                participants: []
            };
        }
        
        // 检查是否已满
        if (currentState.drawnNumbers.length >= 23) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
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
        
        console.log('Saving updated state...');
        // 保存状态
        await store.set('current-state', JSON.stringify(currentState));
        
        console.log('Draw successful');
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
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
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误: ' + error.message,
                error: error.toString()
            })
        };
    }
};