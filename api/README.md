# 🌐 Dramaword API - 后端服务

## 📋 项目概述

Dramaword API 是基于 Node.js + Express + MongoDB 开发的词汇学习应用后端服务。

## 🏗️ 项目结构

```
api/
├── src/
│   ├── index.ts           # 服务器入口
│   ├── controllers/       # 控制器层
│   │   ├── wordController.ts    # 单词控制器
│   │   ├── userController.ts    # 用户控制器
│   │   └── authController.ts    # 认证控制器
│   ├── services/          # 业务逻辑层
│   │   ├── wordService.ts       # 单词服务
│   │   ├── apiService.ts        # 外部API服务
│   │   ├── userService.ts       # 用户服务
│   │   └── celebrationService.ts # 庆祝服务
│   ├── models/            # 数据模型层
│   │   ├── Word.ts        # 单词模型
│   │   ├── User.ts        # 用户模型
│   │   └── Review.ts      # 复习模型
│   ├── middleware/        # 中间件
│   │   ├── auth.ts        # 认证中间件
│   │   ├── validation.ts  # 验证中间件
│   │   └── errorHandler.ts # 错误处理
│   ├── routes/            # 路由定义
│   │   ├── words.ts       # 单词路由
│   │   ├── users.ts       # 用户路由
│   │   └── auth.ts        # 认证路由
│   ├── types/             # 类型定义
│   │   └── api.ts         # API类型
│   └── config/            # 配置文件
│       └── database.ts    # 数据库配置
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript配置
└── .env.example           # 环境变量示例
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- MongoDB Atlas 账户

### 安装依赖
```bash
npm install
```

### 环境变量配置
复制 `.env.example` 为 `.env` 并配置：
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

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

## 🔌 API接口

### 单词相关接口
```
GET    /api/words/:word          # 获取单词数据
GET    /api/words/search         # 搜索单词
GET    /api/words/user           # 获取用户单词
POST   /api/words/save           # 保存单词
DELETE /api/words/:wordId        # 删除单词
POST   /api/words/progress       # 更新学习进度
GET    /api/words/stats          # 获取学习统计
GET    /api/words/review         # 获取复习单词
```

### 用户相关接口
```
POST   /api/auth/register        # 用户注册
POST   /api/auth/login           # 用户登录
POST   /api/auth/logout          # 用户登出
GET    /api/auth/profile         # 获取用户信息
PUT    /api/auth/profile         # 更新用户信息
```

### 系统接口
```
GET    /health                   # 健康检查
```

## 🛠️ 技术特性

- **RESTful API**: 标准的REST API设计
- **类型安全**: 完整的TypeScript类型定义
- **认证授权**: JWT令牌认证
- **数据验证**: 请求参数验证
- **错误处理**: 统一的错误处理机制
- **日志记录**: 完整的请求日志
- **缓存策略**: 数据缓存优化
- **限流保护**: API访问频率限制

## 🔐 安全特性

- **JWT认证**: 安全的用户认证
- **输入验证**: 严格的参数验证
- **CORS配置**: 跨域请求控制
- **限流保护**: 防止API滥用
- **Helmet**: 安全头设置
- **环境变量**: 敏感信息保护

## 📊 性能优化

- **数据库索引**: 查询性能优化
- **连接池**: 数据库连接管理
- **缓存策略**: Redis/内存缓存
- **压缩**: 响应数据压缩
- **异步处理**: 非阻塞操作

## 🔧 开发工具

- **Nodemon**: 开发热重载
- **TypeScript**: 类型安全
- **ESLint**: 代码规范
- **Jest**: 单元测试

## 📚 相关文档

- [架构设计](../ARCHITECTURE.md)
- [部署指南](../DEPLOYMENT.md)
- [MongoDB配置](../docs/MONGODB_SETUP.md) 