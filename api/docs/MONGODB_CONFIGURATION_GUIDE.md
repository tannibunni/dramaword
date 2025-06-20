# MongoDB Atlas 完整配置指南

## 📋 **当前状态检查**
✅ MongoDB Atlas 账户已创建  
✅ 集群已创建  
❌ 数据库用户待创建  
❌ 网络访问待配置  
❌ 连接字符串待获取  
❌ 环境变量待配置  

## 🔧 **第一步：创建数据库用户**

### 1. 在 MongoDB Atlas 控制台中：
```
1. 点击左侧菜单 "Database Access"
2. 点击 "Add New Database User"
3. 选择 "Password" 认证方式
4. 填写用户信息：
   - Username: vocab_app_user
   - Password: 点击 "Autogenerate Secure Password" 并保存密码
5. Database User Privileges:
   - 选择 "Built-in Role"
   - 选择 "Read and write to any database"
6. 点击 "Add User"
```

### 2. 保存用户凭据：
```
用户名: vocab_app_user
密码: [自动生成的密码，请保存]
```

## 🌐 **第二步：配置网络访问**

### 1. 设置 IP 白名单：
```
1. 点击左侧菜单 "Network Access"
2. 点击 "Add IP Address"
3. 选择配置方式：

开发阶段（推荐）：
- 选择 "Allow access from anywhere"
- IP Address: 0.0.0.0/0
- Comment: "Development - Allow all IPs"

生产阶段（更安全）：
- 选择 "Add Current IP Address"
- 或手动添加特定 IP 地址
```

### 2. 确认网络配置：
```
✅ 至少有一个 IP 地址被允许访问
✅ 状态显示为 "Active"
```

## 🔗 **第三步：获取连接字符串**

### 1. 获取连接 URI：
```
1. 回到 "Database" 页面
2. 找到您的集群，点击 "Connect"
3. 选择 "Connect your application"
4. 选择：
   - Driver: Node.js
   - Version: 4.1 or later
5. 复制连接字符串，格式类似：
   mongodb+srv://vocab_app_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 2. 替换密码：
```
将 <password> 替换为您刚才保存的实际密码
最终格式：
mongodb+srv://vocab_app_user:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/vocabulary_app?retryWrites=true&w=majority
```

## ⚙️ **第四步：配置环境变量**

### 1. 创建 .env 文件：
在项目根目录创建 `.env` 文件（如果不存在）

### 2. 添加 MongoDB 配置：
```env
# MongoDB Atlas Configuration
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://vocab_app_user:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/vocabulary_app?retryWrites=true&w=majority

# 其他可选配置
EXPO_PUBLIC_DEBUG_MODE=true
```

### 3. 确保 .env 文件被忽略：
检查 `.gitignore` 文件包含：
```
.env
.env.local
.env.*.local
```

## 🧪 **第五步：测试连接**

### 1. 重启开发服务器：
```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 2. 查看连接日志：
在应用中搜索一个单词，观察控制台输出：
```
🔗 Connecting to MongoDB Atlas...
✅ Connected to MongoDB Atlas
🔍 Querying MongoDB for: [word]
```

### 3. 验证数据保存：
```
💾 Saving to MongoDB: [word]
✅ Word saved to MongoDB: [word]
```

## 📊 **第六步：验证数据库内容**

### 1. 在 MongoDB Atlas 控制台：
```
1. 点击 "Browse Collections"
2. 应该看到 "vocabulary_app" 数据库
3. 包含 "words" 集合
4. 可以查看保存的单词数据
```

### 2. 数据结构示例：
```json
{
  "_id": "example",
  "word": "example",
  "phonetic": "/ɪɡˈzæmpəl/",
  "chineseTranslations": ["例子", "示例"],
  "meanings": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "queryCount": 1
}
```

## 🚨 **故障排除**

### 常见问题：

1. **连接超时**
   - 检查网络访问设置
   - 确认 IP 地址在白名单中

2. **认证失败**
   - 检查用户名密码是否正确
   - 确认用户权限设置

3. **数据库不存在**
   - MongoDB 会自动创建数据库
   - 第一次写入数据时创建

4. **环境变量未生效**
   - 重启开发服务器
   - 检查 .env 文件格式

## 📈 **监控和优化**

### 1. 性能监控：
```
- 在 Atlas 控制台查看 "Metrics"
- 监控连接数、操作数、存储使用
```

### 2. 免费层限制：
```
- 存储：512 MB
- 连接数：500
- 足够开发和小规模使用
```

## ✅ **配置完成检查清单**

- [ ] 数据库用户已创建
- [ ] 网络访问已配置
- [ ] 连接字符串已获取
- [ ] .env 文件已配置
- [ ] 应用可以连接到 MongoDB
- [ ] 单词数据可以保存和查询
- [ ] 在 Atlas 控制台可以看到数据

完成以上步骤后，您的应用就可以使用真正的云端数据库了！