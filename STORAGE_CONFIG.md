# 数据持久性解决方案配置

## 当前方案：JSONBox.io（免费在线JSON存储）

### 配置步骤

1. **无需注册**：JSONBox.io 支持免费匿名使用
2. **自动存储**：数据会自动保存到云端
3. **多设备同步**：不同浏览器和设备会看到相同的抽签结果

### 技术详情

- **存储服务**：https://jsonbox.io/box_lottery_12345
- **数据结构**：JSON格式存储抽签状态
- **读取延迟**：通常<1秒
- **数据保留**：长期保存（除非手动删除）

### 备选方案

如果当前方案有问题，可以考虑以下替代方案：

#### 方案A：Firebase Firestore（推荐）
```javascript
// 需要创建Firebase项目
const FIREBASE_URL = 'your-firebase-url';
```

#### 方案B：Supabase（推荐）
```javascript
// 需要创建Supabase项目
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-anon-key';
```

#### 方案C：Airtable
```javascript
// 需要创建Airtable base
const AIRTABLE_BASE = 'your-base-id';
const AIRTABLE_KEY = 'your-api-key';
```

### 使用说明

1. **首次使用**：系统会自动创建存储空间
2. **数据同步**：每次抽签后自动保存到云端
3. **状态恢复**：打开页面时自动加载最新状态
4. **重置功能**：管理员重置时会清空云端数据

### 注意事项

- JSONBox.io 是第三方免费服务，建议生产环境使用 Firebase 等企业级服务
- 当前配置的存储空间 ID：`box_lottery_12345`
- 如需更改存储空间，修改三个函数文件中的 `STORAGE_URL` 变量

### 测试验证

部署后可以通过以下方式验证：

1. 在一个浏览器中抽签
2. 在另一个浏览器中打开页面
3. 应该能看到之前的抽签结果
4. 尝试重启浏览器，数据应该保持