# 编号抽签系统

一个基于Netlify的在线抽签系统，支持1-23个编号的随机抽签。

## 功能特点

- 🎯 **随机抽签**: 1-23个编号随机分配
- 👥 **班级管理**: 每人需要输入班级号才能抽签
- 🔒 **防重复**: 每个号码只能被抽一次
- 📊 **实时显示**: 实时显示抽签进度和结果
- 📤 **数据导出**: 支持导出CSV格式的抽签结果
- 🔄 **重新开始**: 管理员可以重置抽签（需要密码）
- 📱 **响应式**: 支持手机、平板、电脑访问

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **后端**: Netlify Functions (Node.js)
- **数据存储**: Netlify Blobs
- **部署**: Netlify

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动本地开发服务器：
```bash
npm run dev
```

3. 访问 http://localhost:8888

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
├── style.css              # 样式文件
├── script.js              # 前端JavaScript
├── package.json           # Node.js依赖配置
├── netlify.toml          # Netlify配置
├── netlify/
│   └── functions/        # Netlify Functions
│       ├── draw.js       # 抽签API
│       ├── reset.js      # 重置API
│       └── state.js      # 状态查询API
└── README.md             # 说明文档
```

## API接口

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
在 `script.js` 中修改 `initializeNumbersGrid()` 函数中的数字23为其他数值。

### 修改重置密码
在 `netlify/functions/reset.js` 中修改密码验证逻辑。

### 修改样式
编辑 `style.css` 文件自定义界面样式。

## 注意事项

1. Netlify Blobs是付费功能，免费账户有使用限制
2. 可以考虑替换为其他存储方案（如Airtable、Firebase等）
3. 生产环境建议添加更多的安全验证

## 许可证

MIT License