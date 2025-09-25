// 适合国内使用的数据存储方案
// 使用多个备用存储服务确保可靠性

// 配置多个存储后端
const STORAGE_BACKENDS = [
    {
        name: 'LeanCloud',
        url: 'https://lottery.leanapp.cn/api/state', // 需要您创建LeanCloud应用
        headers: { 'Content-Type': 'application/json' }
    },
    {
        name: 'Gitee',
        url: 'https://gitee.com/api/v5/repos/your-username/lottery-data/contents/state.json', // 需要Gitee仓库
        headers: { 'Content-Type': 'application/json' }
    },
    {
        name: 'Memory', // 内存存储作为最后备用
        url: null,
        headers: {}
    }
];

// 全局状态存储（内存备份）
if (!global.lotteryStateBackup) {
    global.lotteryStateBackup = {
        drawnNumbers: [],
        participants: [],
        lastUpdate: new Date().toISOString()
    };
}

// 读取状态（尝试多个后端）
async function readState() {
    // 优先从内存读取
    if (global.lotteryStateBackup && global.lotteryStateBackup.drawnNumbers.length > 0) {
        console.log('从内存缓存读取状态');
        return global.lotteryStateBackup;
    }
    
    // 尝试从外部服务读取
    for (const backend of STORAGE_BACKENDS) {
        if (!backend.url) continue;
        
        try {
            console.log(`尝试从 ${backend.name} 读取状态`);
            const response = await fetch(backend.url, {
                method: 'GET',
                headers: backend.headers,
                timeout: 5000 // 5秒超时
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && typeof data === 'object' && data.drawnNumbers) {
                    console.log(`从 ${backend.name} 成功读取状态`);
                    // 更新内存缓存
                    global.lotteryStateBackup = data;
                    return data;
                }
            }
        } catch (error) {
            console.log(`从 ${backend.name} 读取失败:`, error.message);
            continue;
        }
    }
    
    // 所有后端都失败，返回默认状态
    console.log('所有存储后端都不可用，返回默认状态');
    const defaultState = { drawnNumbers: [], participants: [], lastUpdate: new Date().toISOString() };
    global.lotteryStateBackup = defaultState;
    return defaultState;
}

// 保存状态（多后端同步）
async function saveState(state) {
    // 添加时间戳
    state.lastUpdate = new Date().toISOString();
    
    // 立即更新内存缓存
    global.lotteryStateBackup = { ...state };
    
    let savedCount = 0;
    
    // 尝试保存到所有可用的后端
    for (const backend of STORAGE_BACKENDS) {
        if (!backend.url) {
            savedCount++; // 内存存储总是成功
            continue;
        }
        
        try {
            console.log(`尝试保存状态到 ${backend.name}`);
            const response = await fetch(backend.url, {
                method: 'POST',
                headers: backend.headers,
                body: JSON.stringify(state),
                timeout: 5000
            });
            
            if (response.ok) {
                console.log(`成功保存到 ${backend.name}`);
                savedCount++;
            }
        } catch (error) {
            console.log(`保存到 ${backend.name} 失败:`, error.message);
            continue;
        }
    }
    
    console.log(`状态已保存到 ${savedCount}/${STORAGE_BACKENDS.length} 个后端`);
    return savedCount > 0; // 至少一个后端成功就算成功
}

exports.handler = async (event, context) => {
    console.log('国内优化版抽签函数调用:', event.httpMethod);
    
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
        const { classNumber } = JSON.parse(event.body || '{}');
        
        // 验证班级号
        if (!classNumber || classNumber.trim() === '') {
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
        console.log('当前抽签状态:', {
            drawn: currentState.drawnNumbers.length,
            total: 23,
            lastUpdate: currentState.lastUpdate
        });
        
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
        
        // 随机选择号码
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const drawnNumber = availableNumbers[randomIndex];
        const timestamp = new Date().toISOString();
        
        console.log(`${classNumber} 抽到号码: ${drawnNumber}`);
        
        // 更新状态
        currentState.drawnNumbers.push(drawnNumber);
        currentState.participants.push({
            classNumber: classNumber.trim(),
            number: drawnNumber,
            timestamp: timestamp
        });
        
        // 保存状态
        const saved = await saveState(currentState);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                number: drawnNumber,
                classNumber: classNumber.trim(),
                timestamp: timestamp,
                saved: saved,
                remainingNumbers: availableNumbers.length - 1,
                storageStatus: '多后端同步'
            })
        };
        
    } catch (error) {
        console.error('抽签错误:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: '服务器内部错误: ' + error.message
            })
        };
    }
};