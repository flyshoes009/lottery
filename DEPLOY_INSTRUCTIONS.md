# 🚀 Netlify部署说明

## 问题描述
本地测试正常，但部署后缺少"抽签配置"功能，显示的是旧版本。

## 原因分析
本地代码已更新（3个提交领先），但由于Git推送权限问题，远程仓库未更新，导致Netlify部署的是旧版本。

## 解决方案

### 方案1：手动部署（推荐）
1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 找到您的抽签系统项目
3. 点击 "Deploys" 标签
4. 选择 "Deploy site" > "Deploy folder"
5. 选择本地项目文件夹：`c:\Users\test\Desktop\workspace\lottery`
6. 排除以下文件夹/文件：
   - `node_modules/`
   - `.git/`
   - `local-test-server.js`
   - `*.md`

### 方案2：Git推送权限修复
1. 检查GitHub仓库权限
2. 确保有push权限到 `flyshoes009/lottery`
3. 或者fork到自己的仓库

### 方案3：创建新的Netlify部署
1. 在Netlify创建新站点
2. 连接到您有权限的Git仓库
3. 设置构建命令（无需特殊构建）

## 验证部署成功
部署后应该看到：
- ✅ "抽签配置" 区域（号码个数输入框 + 确认配置按钮）
- ✅ 可以修改号码个数（1-100）
- ✅ 抽签后配置按钮变灰
- ✅ 号码区域支持滚动

## 核心文件清单
确保以下文件都已部署：
- `index.html` - 包含配置区域
- `style.css` - 包含配置区域样式
- `script.js` - 包含配置管理逻辑
- `netlify/functions/config.js` - 新增的配置API
- `netlify/functions/draw.js` - 支持动态号码
- `netlify/functions/state.js` - 返回配置信息
- `netlify.toml` - Netlify配置