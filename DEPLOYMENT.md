# 🚀 Dramaword 部署指南

## 📋 部署概述

本文档详细说明如何部署Dramaword的前后端分离架构，包括开发环境、测试环境和生产环境的配置。

## 🛠️ 开发环境部署

### 前端开发环境

#### 1. 安装依赖
```bash
cd mobile
npm install
```

#### 2. 环境变量配置
创建 `.env` 文件：
```env
# API配置
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# 其他配置
EXPO_PUBLIC_APP_NAME=Dramaword
EXPO_PUBLIC_APP_VERSION=1.0.0
```

#### 3. 启动开发服务器
```bash
npm run dev
```

### 后端开发环境

#### 1. 安装依赖
```bash
cd api
npm install
```

#### 2. 环境变量配置
创建 `.env` 文件：
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dramaword_dev

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 外部API配置
YOUDAO_APP_ID=your_youdao_app_id
YOUDAO_APP_SECRET=your_youdao_app_secret
OPENAI_API_KEY=your_openai_api_key

# 前端URL (CORS配置)
FRONTEND_URL=http://localhost:8081
```

#### 3. 启动开发服务器
```bash
npm run dev
```

## 🧪 测试环境部署

### Docker部署

#### 1. 创建Docker Compose配置
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - MONGODB_URI=mongodb://mongo:27017/dramaword_test
      - JWT_SECRET=test_jwt_secret
    depends_on:
      - mongo
    volumes:
      - ./api:/app
      - /app/node_modules

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_DATABASE=dramaword_test
    volumes:
      - mongo_test_data:/data/db

volumes:
  mongo_test_data:
```

#### 2. 启动测试环境
```bash
docker-compose -f docker-compose.test.yml up -d
```

### 手动部署

#### 1. 后端部署
```bash
cd api
npm run build
npm start
```

#### 2. 前端测试
```bash
cd mobile
npm run build:web
```

## 🌐 生产环境部署

### 后端生产部署

#### 1. 创建生产Dockerfile
```dockerfile
# api/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
```

#### 2. 生产环境变量
```env
# 生产环境配置
NODE_ENV=production
PORT=3000

# MongoDB Atlas生产集群
MONGODB_URI=mongodb+srv://prod_user:prod_password@prod-cluster.mongodb.net/dramaword_prod

# 强JWT密钥
JWT_SECRET=your_very_strong_production_jwt_secret_key

# 外部API配置
YOUDAO_APP_ID=your_production_youdao_app_id
YOUDAO_APP_SECRET=your_production_youdao_app_secret
OPENAI_API_KEY=your_production_openai_api_key

# 前端URL
FRONTEND_URL=https://your-app-domain.com

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/dramaword/app.log

# 缓存配置
REDIS_URL=redis://your-redis-server:6379

# 监控配置
SENTRY_DSN=your_sentry_dsn
```

#### 3. 云服务器部署 (AWS/GCP/Azure)

##### AWS EC2部署
```bash
# 1. 连接到EC2实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. 安装Docker
sudo apt update
sudo apt install docker.io docker-compose

# 3. 克隆代码
git clone https://github.com/your-repo/dramaword.git
cd dramaword/api

# 4. 配置环境变量
cp .env.example .env
# 编辑.env文件

# 5. 构建和运行
docker build -t dramaword-api .
docker run -d -p 3000:3000 --env-file .env dramaword-api
```

##### 使用Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./api/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped
```

### 前端生产部署

#### 1. Expo EAS Build
```bash
# 安装EAS CLI
npm install -g @expo/eas-cli

# 登录Expo账户
eas login

# 配置构建
eas build:configure

# 构建iOS应用
eas build --platform ios

# 构建Android应用
eas build --platform android
```

#### 2. Web部署
```bash
# 构建Web版本
cd mobile
npm run build:web

# 部署到静态托管服务
# 例如：Vercel, Netlify, AWS S3
```

## 🔒 安全配置

### SSL/TLS配置
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location /api {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 防火墙配置
```bash
# UFW防火墙配置
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 数据库安全
```javascript
// MongoDB Atlas安全配置
// 1. 网络访问控制
// 2. 数据库用户权限
// 3. 加密传输
// 4. 备份策略
```

## 📊 监控和日志

### 应用监控
```javascript
// 集成Sentry错误监控
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 日志配置
```javascript
// 使用Winston日志
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 健康检查
```javascript
// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## 🔄 CI/CD配置

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd api
        npm ci
        
    - name: Run tests
      run: |
        cd api
        npm test
        
    - name: Build application
      run: |
        cd api
        npm run build
        
    - name: Deploy to server
      run: |
        # 部署脚本
        ssh user@server "cd /app && git pull && docker-compose up -d"
```

## 📈 性能优化

### 数据库优化
```javascript
// MongoDB索引优化
WordSchema.index({ word: 1 });
WordSchema.index({ searchTerms: 1 });
WordSchema.index({ queryCount: -1 });
```

### 缓存策略
```javascript
// Redis缓存配置
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 缓存中间件
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### CDN配置
```javascript
// 静态资源CDN
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: true,
}));
```

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MongoDB连接
mongo "mongodb+srv://cluster.mongodb.net/dramaword" --username username

# 检查网络连接
telnet cluster.mongodb.net 27017
```

#### 2. 内存泄漏
```bash
# 监控内存使用
docker stats

# 分析内存使用
node --inspect app.js
```

#### 3. 性能问题
```bash
# 分析慢查询
db.words.find().explain("executionStats")

# 监控API响应时间
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/health"
```

## 📞 支持

如果在部署过程中遇到问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 验证网络连接
4. 联系技术支持团队

---

这个部署指南涵盖了从开发到生产的完整部署流程，确保Dramaword应用能够安全、稳定地运行在各种环境中。 