# 编号抽签系统

一个基于Netlify的在线抽签系统，支持动态配置号码个数（1-100个）的随机抽签。

## 功能特点

- 🎯 **动态配置**: 支持动态设置号码个数（1-100个）
- 🎲 **随机抽签**: 根据配置的号码个数随机分配
- 👥 **班级管理**: 每人需要输入班级号才能抽签
- 🔒 **防重复**: 每个号码只能被抽一次
- 📊 **实时显示**: 实时显示抽签进度和结果
- 📤 **数据导出**: 支持导出CSV格式的抽签结果
- 🔄 **重新开始**: 管理员可以重置抽签（需要密码）
- 📱 **响应式**: 支持手机、平板、电脑访问
- 🌐 **多设备同步**: 基于Firebase的实时数据同步

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Netlify Functions (Node.js)
- **数据存储**: Firebase Realtime Database
- **部署**: Netlify
- **开发工具**: 本地测试服务器

## 本地开发

### 方法一：使用本地测试服务器（推荐）

为了解决Netlify Dev启动慢和Edge Functions环境问题，我们提供了一个独立的本地测试服务器。

1. 直接启动本地测试服务器：
```bash
node local-test-server.js
```

2. 访问 http://localhost:3001

**本地测试服务器特点：**
- ✅ **快速启动**：无需等待Netlify环境初始化
- ✅ **完整功能**：直接运行所有Netlify Functions代码
- ✅ **实时数据**：连接真实的Firebase数据库
- ✅ **调试友好**：提供详细的Console日志输出
- ✅ **CORS支持**：自动处理跨域请求

**支持的API端点：**
- `POST /.netlify/functions/draw` - 抽签功能
- `GET /.netlify/functions/state` - 获取状态
- `POST /.netlify/functions/reset` - 重置抽签
- `GET/POST /.netlify/functions/config` - 配置管理

### 方法二：使用Netlify Dev

1. 安装依赖：
```bash
npm install
```

2. 启动Netlify开发服务器：
```bash
npm run dev
```

3. 访问 http://localhost:8888

### 本地开发注意事项

⚠️ **重要提醒**：本地测试使用的是**生产环境的Firebase数据库**，所有操作都会影响线上数据：

- 本地修改配置会立即影响部署环境
- 本地抽签操作会在部署环境中显示
- 本地重置会清空所有线上数据
- 多人同时访问会看到相同的实时数据

💡 **开发建议**：
- 开发时可以先在本地测试功能
- 确认功能正常后再进行重要操作
- 建议使用小的测试数据进行验证

## 部署到Netlify

### 方法一：通过Git仓库部署

1. 将代码推送到Git仓库（GitHub、GitLab等）
2. 在Netlify控制台中连接仓库
3. 设置构建命令为 `npm run build`
4. 设置发布目录为 `.`
5. 部署

### 方法二：拖拽部署

1. 将整个项目文件夹拖拽到Netlify控制台
2. 自动部署

## 使用说明

### 抽签流程

1. 输入班级号
2. 点击"抽签"按钮
3. 系统随机分配一个未被抽取的号码
4. 号码被锁定，其他人无法再抽到

### 管理功能

- **重新开始**: 点击"重新开始"按钮，输入密码 `12345678` 可以重置所有抽签数据
- **导出结果**: 点击"导出CSV"按钮可以下载抽签结果

### 安全说明

- 重置密码默认为：`12345678`
- 建议在生产环境中修改密码
- 可以在 `netlify/functions/reset.js` 中修改密码

## 文件结构

```
lottery/
├── index.html              # 主页面
├── style.css               # 样式文件
├── script.js               # 前端JavaScript
├── local-test-server.js    # 本地测试服务器
├── package.json            # Node.js依赖配置
├── netlify.toml            # Netlify配置
├── netlify/
│   └── functions/           # Netlify Functions
│       ├── draw.js          # 抽签API
│       ├── config.js        # 配置管理API
│       ├── reset.js         # 重置API
│       └── state.js         # 状态查询API
└── README.md               # 说明文档
```

### 本地测试服务器原理

`local-test-server.js` 是一个独立的Node.js HTTP服务器，它：

1. **直接导入Netlify Functions**：无需Netlify环境即可运行Functions代码
2. **模拟事件对象**：将HTTP请求转换为Netlify Functions事件格式
3. **静态文件服务**：支持HTML/CSS/JS等静态资源访问
4. **CORS处理**：自动解决跨域问题
5. **错误处理**：提供详细的错误信息和日志

**启动步骤**：
```bash
# 直接运行
node local-test-server.js

# 或者使用项目脚本（需要在package.json中配置）
npm run local
```

**输出示例**：
```
🚀 本地测试服务器启动成功！
📡 服务器地址: http://localhost:3001
✅ 支持的API端点:
   - POST /.netlify/functions/draw
   - GET  /.netlify/functions/state
   - POST /.netlify/functions/reset
   - GET/POST /.netlify/functions/config
```

## API接口

### GET/POST /.netlify/functions/config
配置管理接口

**GET请求** - 获取当前配置：
响应：
```json
{
  "success": true,
  "config": {
    "totalNumbers": 23,
    "isLocked": false,
    "lastUpdate": "2024-01-01T12:00:00.000Z"
  }
}
```

**POST请求** - 更新配置：
请求体：
```json
{
  "totalNumbers": 30
}
```

响应：
```json
{
  "success": true,
  "message": "号码个数已设置为 30",
  "config": {
    "totalNumbers": 30,
    "isLocked": false
  }
}
```

### POST /.netlify/functions/draw
抽签接口

请求体：
```json
{
  "classNumber": "班级号"
}
```

响应：
```json
{
  "success": true,
  "number": 5,
  "classNumber": "1班",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /.netlify/functions/state
获取当前抽签状态

响应：
```json
{
  "success": true,
  "state": {
    "drawnNumbers": [1, 3, 5],
    "participants": [
      {
        "classNumber": "1班",
        "number": 1,
        "timestamp": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### POST /.netlify/functions/reset
重置抽签

请求体：
```json
{
  "password": "12345678"
}
```

## 自定义配置

### 修改号码数量
可以通过以下方式修改号码数量：

1. **前端界面**：在抽签配置区域输入新的号码个数（1-100）并点击“确认配置”
2. **API调用**：使用 POST `/.netlify/functions/config` 接口
3. **默认值**：在 `script.js` 中修改 `totalNumbers` 初始值

### 修改重置密码
在 `netlify/functions/reset.js` 中修改密码验证逻辑。

### 修改样式
编辑 `style.css` 文件自定义界面样式。

### Firebase配置
如需修改数据库连接，请更新 `netlify/functions/` 中所有文件的 `FIREBASE_URL` 变量。

## 注意事项

1. **数据安全**：Firebase数据库为生产环境，请谨慎操作
2. **并发控制**：系统已实现乐观锁机制，支持多人同时抽签
3. **配置锁定**：抽签开始后自动锁定配置，防止中途修改
4. **网络依赖**：需要稳定的网络连接访问Firebase服务
5. **浏览器兼容**：建议使用现代浏览器以获得最佳体验

## 许可证

MIT License