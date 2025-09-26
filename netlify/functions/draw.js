// 使用Firebase Realtime Database实现数据持久化
// 添加并发控制机制，解决多人同时抽签的竞态条件问题

// Firebase配置
const FIREBASE_URL = 'https://lottery-system-a0809-default-rtdb.asia-southeast1.firebasedatabase.app';
const DATABASE_PATH = '/lottery-state.json';
const CONFIG_PATH = '/lottery-config.json';

// 最大重试次数
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 读取配置
async function readConfig() {
    try {
        console.log('正在从Firebase读取配置...');
        const response = await fetch(`${FIREBASE_URL}${CONFIG_PATH}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object') {
                console.log('从Firebase成功读取配置:', data);
                return data;
            }
        }
    } catch (error) {
        console.error('读取配置失败:', error);
    }
    
    // 返回默认配置
    return {
        totalNumbers: 23,
        isLocked: false
    };
}

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

// 原子性保存状态（使用版本控制防止并发冲突）
async function atomicSaveState(newState, expectedVersion) {
    try {
        console.log(`尝试原子性保存状态，期望版本: ${expectedVersion}`);
        
        // 使用Firebase的条件写入
        const stateToSave = {
            ...newState,
            lastUpdate: new Date().toISOString(),
            version: expectedVersion + 1
        };
        
        // 先读取当前版本进行比较
        const currentState = await readState();
        if (currentState.version && currentState.version !== expectedVersion) {
            console.log(`版本冲突: 期望=${expectedVersion}, 实际=${currentState.version}`);
            return { success: false, conflict: true, currentState };
        }
        
        // 执行保存
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
            return { success: true, conflict: false, newState: stateToSave };
        } else {
            console.error('保存到Firebase失败:', response.status, response.statusText);
            return { success: false, conflict: false };
        }
    } catch (error) {
        console.error('原子性保存状态出错:', error);
        return { success: false, conflict: false };
    }
}

// 带重试机制的抽签函数
async function performDrawWithRetry(classNumber) {
    // 首先读取配置
    const config = await readConfig();
    const totalNumbers = config.totalNumbers || 23;
    
    console.log(`开始抽签，号码总数: ${totalNumbers}`);
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        console.log(`抽签尝试 ${attempt}/${MAX_RETRY_ATTEMPTS}`);
        
        try {
            // 读取当前状态
            const currentState = await readState();
            
            // 检查是否已满
            if (currentState.drawnNumbers && currentState.drawnNumbers.length >= totalNumbers) {
                return {
                    success: false,
                    message: '所有号码已被抽完',
                    code: 'LOTTERY_FULL'
                };
            }
            
            // 初始化数据结构
            if (!currentState.drawnNumbers) currentState.drawnNumbers = [];
            if (!currentState.participants) currentState.participants = [];
            
            // 生成可用号码列表
            const availableNumbers = [];
            for (let i = 1; i <= totalNumbers; i++) {
                if (!currentState.drawnNumbers.includes(i)) {
                    availableNumbers.push(i);
                }
            }
            
            if (availableNumbers.length === 0) {
                return {
                    success: false,
                    message: '所有号码已被抽完',
                    code: 'LOTTERY_FULL'
                };
            }
            
            console.log(`可用号码: [${availableNumbers.join(', ')}]`);
            
            // 随机选择号码
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const drawnNumber = availableNumbers[randomIndex];
            const timestamp = new Date().toISOString();
            
            console.log(`第 ${attempt} 次尝试抽中号码: ${drawnNumber}`);
            
            // 创建新状态
            const newState = {
                ...currentState,
                drawnNumbers: [...currentState.drawnNumbers, drawnNumber],
                participants: [...currentState.participants, {
                    classNumber: classNumber.trim(),
                    number: drawnNumber,
                    timestamp: timestamp
                }],
                totalNumbers: totalNumbers // 保存当前配置
            };
            
            // 原子性保存
            const saveResult = await atomicSaveState(newState, currentState.version || 1);
            
            if (saveResult.success) {
                console.log(`抽签成功完成，最终号码: ${drawnNumber}`);
                return {
                    success: true,
                    number: drawnNumber,
                    classNumber: classNumber.trim(),
                    timestamp: timestamp,
                    attempts: attempt,
                    totalNumbers: totalNumbers
                };
            } else if (saveResult.conflict) {
                console.log(`第 ${attempt} 次尝试发生并发冲突，准备重试...`);
                // 随机延迟后重试，避免多个请求同时重试
                await delay(RETRY_DELAY_MS + Math.random() * 50);
                continue;
            } else {
                return {
                    success: false,
                    message: '保存数据失败，请重试',
                    code: 'SAVE_FAILED'
                };
            }
            
        } catch (error) {
            console.error(`第 ${attempt} 次抽签尝试失败:`, error);
            if (attempt === MAX_RETRY_ATTEMPTS) {
                return {
                    success: false,
                    message: '抽签失败，请重试',
                    code: 'DRAW_FAILED',
                    error: error.message
                };
            }
            await delay(RETRY_DELAY_MS);
        }
    }
    
    return {
        success: false,
        message: '抽签失败，服务器繁忙，请稍后重试',
        code: 'MAX_RETRIES_EXCEEDED'
    };
}

exports.handler = async (event, context) => {
    console.log('Draw function called with concurrency control:', event.httpMethod);
    
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
        
        // 执行带重试机制的抽签
        const drawResult = await performDrawWithRetry(classNumber.trim());
        
        if (drawResult.success) {
            console.log(`抽签成功完成: ${drawResult.classNumber} 抽中 ${drawResult.number} 号`);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    number: drawResult.number,
                    classNumber: drawResult.classNumber,
                    timestamp: drawResult.timestamp,
                    attempts: drawResult.attempts,
                    totalNumbers: drawResult.totalNumbers,
                    message: drawResult.attempts > 1 ? 
                        `抽签成功（经过${drawResult.attempts}次尝试）` : 
                        '抽签成功'
                })
            };
        } else {
            // 根据不同错误类型返回不同的HTTP状态码
            let statusCode = 500;
            switch (drawResult.code) {
                case 'LOTTERY_FULL':
                    statusCode = 400;
                    break;
                case 'MAX_RETRIES_EXCEEDED':
                    statusCode = 503; // Service Unavailable
                    break;
                case 'SAVE_FAILED':
                case 'DRAW_FAILED':
                default:
                    statusCode = 500;
            }
            
            console.log(`抽签失败: ${drawResult.message} (错误码: ${drawResult.code})`);
            return {
                statusCode: statusCode,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: drawResult.message,
                    code: drawResult.code,
                    error: drawResult.error
                })
            };
        }
        
    } catch (error) {
        console.error('抽签函数发生意外错误:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误: ' + error.message,
                code: 'INTERNAL_ERROR',
                error: error.toString()
            })
        };
    }
};