// 本地测试服务器 - 直接运行Node.js服务器进行快速测试
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 导入Netlify Functions
const drawHandler = require('./netlify/functions/draw.js').handler;
const stateHandler = require('./netlify/functions/state.js').handler;
const resetHandler = require('./netlify/functions/reset.js').handler;
const configHandler = require('./netlify/functions/config.js').handler;

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// 服务器创建
const server = http.createServer(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    try {
        // 处理API请求
        if (pathname.startsWith('/.netlify/functions/')) {
            const functionName = pathname.split('/').pop();
            
            // 收集请求体
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                // 构造Netlify Functions事件对象
                const event = {
                    httpMethod: req.method,
                    path: pathname,
                    queryStringParameters: parsedUrl.query,
                    headers: req.headers,
                    body: body || null
                };
                
                const context = {};
                
                try {
                    let result;
                    
                    // 路由到对应的函数
                    switch (functionName) {
                        case 'draw':
                            result = await drawHandler(event, context);
                            break;
                        case 'state':
                            result = await stateHandler(event, context);
                            break;
                        case 'reset':
                            result = await resetHandler(event, context);
                            break;
                        case 'config':
                            result = await configHandler(event, context);
                            break;
                        default:
                            result = {
                                statusCode: 404,
                                body: JSON.stringify({ error: 'Function not found' })
                            };
                    }
                    
                    // 设置响应头
                    if (result.headers) {
                        for (const [key, value] of Object.entries(result.headers)) {
                            res.setHeader(key, value);
                        }
                    }
                    
                    res.writeHead(result.statusCode || 200);
                    res.end(result.body || '');
                    
                } catch (error) {
                    console.error(`Function ${functionName} error:`, error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'Internal server error',
                        message: error.message 
                    }));
                }
            });
            
            return;
        }
        
        // 处理静态文件
        let filePath = pathname === '/' ? '/index.html' : pathname;
        filePath = path.join(__dirname, filePath);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        // 获取文件扩展名
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // 读取并返回文件
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

// 启动服务器
server.listen(PORT, () => {
    console.log('🚀 本地测试服务器启动成功！');
    console.log(`📡 服务器地址: http://localhost:${PORT}`);
    console.log('✅ 支持的API端点:');
    console.log('   - POST /.netlify/functions/draw');
    console.log('   - GET  /.netlify/functions/state');
    console.log('   - POST /.netlify/functions/reset');
    console.log('   - GET/POST /.netlify/functions/config');
    console.log('\n🎯 请在浏览器中访问: http://localhost:3000');
    console.log('   或点击预览按钮测试完整功能');
    console.log('\n按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

// 错误处理
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请关闭其他服务或修改端口号`);
    } else {
        console.error('❌ 服务器错误:', error);
    }
    process.exit(1);
});