// 抽签系统配置管理API
// 支持动态修改号码个数配置

const FIREBASE_URL = 'https://lottery-system-a0809-default-rtdb.asia-southeast1.firebasedatabase.app';
const CONFIG_PATH = '/lottery-config.json';
const STATE_PATH = '/lottery-state.json';

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
    const defaultConfig = {
        totalNumbers: 23,
        isLocked: false,
        lastUpdate: new Date().toISOString()
    };
    console.log('返回默认配置');
    return defaultConfig;
}

// 保存配置
async function saveConfig(config) {
    try {
        console.log('正在保存配置到Firebase:', config);
        const response = await fetch(`${FIREBASE_URL}${CONFIG_PATH}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...config,
                lastUpdate: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log('配置已成功保存到Firebase');
            return { success: true };
        } else {
            console.error('保存配置到Firebase失败:', response.status, response.statusText);
            return { success: false };
        }
    } catch (error) {
        console.error('保存配置出错:', error);
        return { success: false };
    }
}

// 检查是否有人已经开始抽签
async function checkLotteryStarted() {
    try {
        const response = await fetch(`${FIREBASE_URL}${STATE_PATH}`);
        if (response.ok) {
            const state = await response.json();
            if (state && state.drawnNumbers && state.drawnNumbers.length > 0) {
                return true;
            }
        }
    } catch (error) {
        console.error('检查抽签状态失败:', error);
    }
    return false;
}

exports.handler = async (event, context) => {
    console.log('Config function called:', event.httpMethod);
    
    // 设置CORS头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    try {
        if (event.httpMethod === 'GET') {
            // 获取当前配置
            const config = await readConfig();
            const isStarted = await checkLotteryStarted();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    config: {
                        ...config,
                        isLocked: isStarted || config.isLocked
                    }
                })
            };
            
        } else if (event.httpMethod === 'POST') {
            // 更新配置
            const { totalNumbers } = JSON.parse(event.body || '{}');
            
            // 验证号码个数
            if (!totalNumbers || totalNumbers < 1 || totalNumbers > 100) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: '号码个数必须在1-100之间'
                    })
                };
            }
            
            // 检查是否已经开始抽签
            const isStarted = await checkLotteryStarted();
            if (isStarted) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: '抽签已开始，无法修改配置'
                    })
                };
            }
            
            // 保存新配置
            const newConfig = {
                totalNumbers: parseInt(totalNumbers),
                isLocked: false
            };
            
            const saveResult = await saveConfig(newConfig);
            
            if (saveResult.success) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: `号码个数已设置为 ${totalNumbers}`,
                        config: newConfig
                    })
                };
            } else {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: '保存配置失败，请重试'
                    })
                };
            }
            
        } else {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Method not allowed'
                })
            };
        }
        
    } catch (error) {
        console.error('配置函数发生错误:', error);
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