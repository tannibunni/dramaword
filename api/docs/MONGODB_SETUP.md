# MongoDB Atlas 配置指南

## 1. 注册 MongoDB Atlas 账户

### 步骤 1: 访问 MongoDB Atlas
- 访问：https://www.mongodb.com/cloud/atlas
- 点击 "Try Free" 注册免费账户
- 使用 Google/GitHub 账户或邮箱注册

### 步骤 2: 创建集群
```
1. 选择 "Build a Database"
2. 选择 "M0 Sandbox" (免费版)
3. 选择云服务商：AWS/Google Cloud/Azure
4. 选择地区：选择离用户最近的地区
5. 集群名称：vocabulary-app-cluster
6. 点击 "Create"
```

### 步骤 3: 配置数据库访问
```
1. Database Access:
   - 创建数据库用户
   - 用户名：vocab_user
   - 密码：生成强密码并保存
   - 权限：Read and write to any database

2. Network Access:
   - 添加 IP 地址
   - 选择 "Allow access from anywhere" (0.0.0.0/0)
   - 或添加特定 IP 地址
```

### 步骤 4: 获取连接字符串
```
1. 点击 "Connect"
2. 选择 "Connect your application"
3. 选择 Driver: Node.js
4. 复制连接字符串：
   mongodb+srv://vocab_user:<password>@vocabulary-app-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 2. 环境变量配置

### 创建 .env 文件
```env
# MongoDB Atlas
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://vocab_user:YOUR_PASSWORD@vocabulary-app-cluster.xxxxx.mongodb.net/vocabulary_app?retryWrites=true&w=majority

# API Keys (如果需要)
EXPO_PUBLIC_YOUDAO_APP_ID=your_youdao_app_id
EXPO_PUBLIC_YOUDAO_APP_SECRET=your_youdao_app_secret
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### 环境变量说明
- `EXPO_PUBLIC_MONGODB_URI`: MongoDB 连接字符串
- 其他 API 密钥根据需要配置

## 3. 数据库结构设计

### 集合 (Collections) 结构
```javascript
// words 集合
{
  _id: "obtain",
  word: "obtain",
  phonetic: "/əbˈteɪn/",
  audioUrl: "https://...",
  chineseTranslations: ["获得", "取得", "达到"],
  meanings: [
    {
      partOfSpeech: "动词",
      definition: "通过努力或请求得到某物",
      exampleEn: "The company obtained a patent for their new invention.",
      exampleCn: "公司为他们的新发明获得了专利。"
    }
  ],
  derivatives: ["obtainable", "obtainer", "obtaining"],
  synonyms: ["acquire", "attain", "secure"],
  difficulty: 2,
  createdAt: ISODate("2024-01-15"),
  lastQueried: ISODate("2024-01-15"),
  queryCount: 1,
  searchTerms: ["obtain", "获得", "取得", "达到", "acquire", "attain"]
}

// user_words 集合 (用户个人学习数据)
{
  _id: ObjectId("..."),
  userId: "user_123",
  word: "obtain",
  reviewCount: 3,
  correctCount: 2,
  isKnown: false,
  lastReviewed: ISODate("2024-01-15"),
  createdAt: ISODate("2024-01-10")
}
```

## 4. 安全配置

### 数据库安全
- 使用强密码
- 限制 IP 访问（生产环境）
- 定期轮换密码
- 启用审计日志

### 应用安全
- 环境变量不要提交到 Git
- 使用 .gitignore 忽略 .env 文件
- 生产环境使用不同的数据库

## 5. 监控和维护

### MongoDB Atlas 监控
- 查看数据库性能指标
- 监控存储使用情况
- 设置告警通知

### 数据备份
- Atlas 自动备份功能
- 定期导出重要数据
- 测试恢复流程