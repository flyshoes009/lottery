// 本地服务器快速功能测试
const http = require('http');

const SERVER_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SERVER_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ statusCode: res.statusCode, data: parsed });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 开始本地服务器功能测试\n');

    try {
        // 1. 测试配置API - 获取
        console.log('📋 1. 测试获取配置...');
        const configResult = await makeRequest('/.netlify/functions/config');
        console.log(`   状态码: ${configResult.statusCode}`);
        console.log(`   结果: ${JSON.stringify(configResult.data, null, 2)}\n`);

        // 2. 测试配置API - 更新
        console.log('🔧 2. 测试更新配置到30个号码...');
        const updateResult = await makeRequest('/.netlify/functions/config', 'POST', { totalNumbers: 30 });
        console.log(`   状态码: ${updateResult.statusCode}`);
        console.log(`   结果: ${JSON.stringify(updateResult.data, null, 2)}\n`);

        // 3. 测试状态API
        console.log('📊 3. 测试状态API...');
        const stateResult = await makeRequest('/.netlify/functions/state');
        console.log(`   状态码: ${stateResult.statusCode}`);
        console.log(`   结果: ${JSON.stringify(stateResult.data, null, 2)}\n`);

        // 4. 测试抽签API
        console.log('🎲 4. 测试抽签API...');
        const drawResult = await makeRequest('/.netlify/functions/draw', 'POST', { classNumber: '测试班级' });
        console.log(`   状态码: ${drawResult.statusCode}`);
        console.log(`   结果: ${JSON.stringify(drawResult.data, null, 2)}\n`);

        // 5. 再次测试配置锁定
        console.log('🔒 5. 测试配置锁定机制...');
        const lockResult = await makeRequest('/.netlify/functions/config', 'POST', { totalNumbers: 25 });
        console.log(`   状态码: ${lockResult.statusCode}`);
        console.log(`   结果: ${JSON.stringify(lockResult.data, null, 2)}\n`);

        console.log('✅ 所有测试完成！');
        console.log('🎯 如果看到合理的响应，说明服务器工作正常');
        console.log('📱 现在可以在浏览器中测试完整功能了');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 等待2秒让服务器完全启动
setTimeout(runTests, 2000);