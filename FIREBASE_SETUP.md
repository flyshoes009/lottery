# Firebase 数据持久性配置指南

## 🔥 为什么选择Firebase？

- ✅ **完全免费** - Realtime Database 免费额度足够使用
- ✅ **高可靠性** - Google 提供的企业级服务
- ✅ **实时同步** - 多设备实时数据同步
- ✅ **无需服务器** - 直接从前端访问

## 📋 配置步骤

### 1. 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称：`lottery-system`
4. 禁用 Google Analytics（不需要）
5. 点击"创建项目"

### 2. 启用 Realtime Database

1. 在 Firebase 控制台左侧菜单，点击 "Realtime Database"
2. 点击"创建数据库"
3. 选择地区（选择离您最近的）
4. 安全规则选择"以测试模式启动"（暂时允许所有读写）
5. 点击"启用"

### 3. 获取数据库 URL

创建完成后，您会看到类似这样的 URL：
```
https://lottery-system-default-rtdb.firebaseio.com/
```

### 4. 更新代码配置

在 `netlify/functions/draw.js` 中，替换以下行：
```javascript
const FIREBASE_URL = 'https://lottery-system-default-rtdb.firebaseio.com';
```

### 5. 配置安全规则（重要）

在 Firebase 控制台的 Realtime Database > 规则中，设置：
```json
{
  "rules": {
    "lottery-state": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 🚀 部署验证

1. 更新 Netlify 部署
2. 测试抽签功能
3. 在 Firebase 控制台查看数据是否正确保存
4. 在不同设备/浏览器测试数据同步

## 🔧 故障排除

### 问题：CORS 错误
**解决方案**：确保 Firebase 项目的安全规则正确设置

### 问题：数据不同步
**解决方案**：检查 Firebase URL 是否正确，确保网络连接正常

### 问题：403 错误
**解决方案**：检查 Realtime Database 的安全规则是否允许读写

## 💡 后续优化

1. **安全规则优化**：生产环境中限制写入权限
2. **数据验证**：添加数据格式验证规则
3. **备份机制**：定期备份抽签数据

## 📊 数据结构

Firebase 中的数据结构：
```json
{
  "lottery-state": {
    "drawnNumbers": [1, 5, 12],
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