# 🚀 Dramaword API 部署指南

## 快速部署选项

### 选项1: Railway (推荐)
1. 访问 [Railway.app](https://railway.app)
2. 使用GitHub账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择您的Dramaword仓库
5. 设置环境变量：
   ```
   MONGODB_URI=mongodb+srv://dramaword:ED9dEfKvQVN4768A@cluster0.au9qbj5.mongodb.net/dramaword_dev?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=production
   PORT=3000
   ```
6. 点击 "Deploy Now"

### 选项2: Render
1. 访问 [Render.com](https://render.com)
2. 使用GitHub账号登录
3. 点击 "New" → "Web Service"
4. 连接您的GitHub仓库
5. 配置：
   - Name: `dramaword-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. 设置环境变量（同上）
7. 点击 "Create Web Service"

### 选项3: Vercel
1. 访问 [Vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 导入您的GitHub仓库
5. 设置环境变量（同上）
6. 点击 "Deploy"

## 部署后配置

### 1. 获取部署URL
部署完成后，您会得到一个类似这样的URL：
- Railway: `https://dramaword-api-production.up.railway.app`
- Render: `https://dramaword-api.onrender.com`
- Vercel: `https://dramaword-api.vercel.app`

### 2. 测试API
```bash
curl https://your-deployed-url.com/health
```

### 3. 更新前端配置
在 `mobile/.env` 文件中更新API URL：
```env
EXPO_PUBLIC_API_URL=https://your-deployed-url.com/api
```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| MONGODB_URI | MongoDB连接字符串 | ✅ |
| JWT_SECRET | JWT密钥 | ✅ |
| NODE_ENV | 环境模式 | ✅ |
| PORT | 端口号 | ✅ |
| OPENAI_API_KEY | OpenAI API密钥 | ❌ |
| YOUDAO_APP_ID | 有道API ID | ❌ |
| YOUDAO_APP_KEY | 有道API密钥 | ❌ |

## 故障排除

### 1. 构建失败
- 检查 `package.json` 中的脚本是否正确
- 确保所有依赖都已安装

### 2. 运行时错误
- 检查环境变量是否正确设置
- 查看部署平台的日志

### 3. 数据库连接问题
- 确保MongoDB URI正确
- 检查网络连接

## 监控和维护

### 健康检查
API提供健康检查端点：`/health`

### 日志
在部署平台的控制台中查看应用日志

### 更新部署
推送代码到GitHub主分支会自动触发重新部署 