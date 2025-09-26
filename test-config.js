// 配置功能测试脚本
const http = require('http');

const SERVER_URL = 'http://localhost:8888';

// 测试配置API
async function testConfigAPI() {
    console.log('🧪 开始测试配置功能...\n');
    
    // 1. 测试获取当前配置
    console.log('📋 测试获取当前配置...');
    try {
        const response = await fetch(`${SERVER_URL}/.netlify/functions/config`);
        const data = await response.json();
        console.log('✅ 获取配置成功:', data);
    } catch (error) {
        console.log('❌ 获取配置失败:', error.message);
    }
    
    console.log('\n-------------------\n');
    
    // 2. 测试更新配置
    console.log('🔧 测试更新配置到30个号码...');
    try {
        const response = await fetch(`${SERVER_URL}/.netlify/functions/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ totalNumbers: 30 })
        });
        const data = await response.json();
        console.log('✅ 更新配置结果:', data);
    } catch (error) {
        console.log('❌ 更新配置失败:', error.message);
    }
    
    console.log('\n-------------------\n');
    
    // 3. 测试状态API是否返回新配置
    console.log('📊 测试状态API是否包含新配置...');
    try {
        const response = await fetch(`${SERVER_URL}/.netlify/functions/state`);
        const data = await response.json();
        console.log('✅ 状态API响应:', {
            success: data.success,
            totalNumbers: data.state?.totalNumbers,
            drawnCount: data.state?.drawnNumbers?.length || 0,
            hasConfig: !!data.config
        });
    } catch (error) {
        console.log('❌ 状态API测试失败:', error.message);
    }
    
    console.log('\n-------------------\n');
    
    // 4. 测试抽签一次以锁定配置
    console.log('🎲 测试抽签以锁定配置...');
    try {
        const response = await fetch(`${SERVER_URL}/.netlify/functions/draw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classNumber: '测试班' })
        });
        const data = await response.json();
        console.log('✅ 抽签结果:', {
            success: data.success,
            number: data.number,
            totalNumbers: data.totalNumbers
        });
    } catch (error) {
        console.log('❌ 抽签失败:', error.message);
    }
    
    console.log('\n-------------------\n');
    
    // 5. 测试配置是否被锁定
    console.log('🔒 测试配置是否被锁定...');
    try {
        const response = await fetch(`${SERVER_URL}/.netlify/functions/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ totalNumbers: 25 })
        });
        const data = await response.json();
        console.log('✅ 锁定测试结果:', data);
        
        if (!data.success && data.message.includes('已开始')) {
            console.log('🎉 配置锁定机制工作正常！');
        } else {
            console.log('⚠️ 配置锁定可能未生效');
        }
    } catch (error) {
        console.log('❌ 锁定测试失败:', error.message);
    }
    
    console.log('\n🎯 配置功能测试完成！');
}

// 运行测试
testConfigAPI().catch(console.error);