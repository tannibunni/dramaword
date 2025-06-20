# 🏗️ Dramaword 前后端分离架构设计

## 📋 项目概述

Dramaword 是一个智能词汇学习应用，采用前后端分离架构，提供更好的安全性、可维护性和扩展性。

## 🏛️ 整体架构

```
Dramaword/
├── mobile/                 # 前端项目 (React Native + Expo)
│   ├── src/
│   │   ├── services/       # API客户端服务
│   │   ├── stores/         # 状态管理 (Zustand)
│   │   ├── types/          # TypeScript类型定义
│   │   └── components/     # UI组件
│   └── package.json
├── api/                    # 后端项目 (Node.js + Express)
│   ├── src/
│   │   ├── controllers/    # 控制器层
│   │   ├── services/       # 业务逻辑层
│   │   ├── models/         # 数据模型层
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由定义
│   │   └── config/         # 配置文件
│   └── package.json
└── docs/                   # 项目文档
```

## 📱 前端架构 (mobile/)

### 技术栈
- **框架**: React Native 0.79.1 + Expo SDK 53
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **类型系统**: TypeScript
- **UI组件**: 原生组件 + Lucide React Native

### 核心文件结构

#### 1. **API客户端** (`src/services/apiClient.ts`)
```typescript
// 统一的HTTP客户端，处理：
// - 请求/响应拦截
// - 认证token管理
// - 错误处理
// - 网络状态检查
```

#### 2. **业务服务** (`src/services/wordService.ts`)
```typescript
// 简化的业务逻辑，专注于：
// - API调用
// - 数据转换
// - 错误处理
```

#### 3. **状态管理** (`src/stores/wordStore.ts`)
```typescript
// Zustand状态管理，处理：
// - 本地状态缓存
// - 数据同步
// - 用户交互状态
```

#### 4. **类型定义** (`src/types/word.ts`)
```typescript
// 完整的TypeScript类型定义
// - API响应类型
// - 业务数据类型
// - 用户相关类型
```

### 前端优势
- ✅ **轻量化**: 移除复杂业务逻辑，专注UI交互
- ✅ **类型安全**: 完整的TypeScript类型定义
- ✅ **状态管理**: 使用Zustand简化状态管理
- ✅ **离线支持**: 本地缓存和状态持久化
- ✅ **多端支持**: 同一套API支持多端应用

## 🌐 后端架构 (api/)

### 技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT
- **验证**: Joi
- **缓存**: Node-Cache
- **安全**: Helmet, CORS, Rate Limiting

### 核心文件结构

#### 1. **主入口** (`src/index.ts`)
```typescript
// 服务器启动和配置
// - 中间件配置
// - 路由注册
// - 错误处理
// - 数据库连接
```

#### 2. **数据模型** (`src/models/Word.ts`)
```typescript
// Mongoose数据模型
// - 数据结构定义
// - 索引优化
// - 中间件处理
// - 静态方法
```

#### 3. **控制器** (`src/controllers/wordController.ts`)
```typescript
// 请求处理逻辑
// - 参数验证
// - 业务调用
// - 响应格式化
// - 错误处理
```

#### 4. **业务服务** (`src/services/wordService.ts`)
```typescript
// 核心业务逻辑
// - 多源数据聚合
// - 缓存策略
// - 数据转换
// - 外部API集成
```

#### 5. **中间件** (`src/middleware/auth.ts`)
```typescript
// 认证和授权
// - JWT验证
// - 用户信息注入
// - 权限检查
```

### 后端优势
- ✅ **安全性**: API密钥保护，JWT认证
- ✅ **性能**: 缓存策略，数据库优化
- ✅ **可扩展**: 模块化架构，易于扩展
- ✅ **监控**: 日志记录，错误追踪
- ✅ **API设计**: RESTful API，统一响应格式

## 🔄 数据流

### 1. **单词查询流程**
```
前端 → API客户端 → 后端控制器 → 业务服务 → 数据库/外部API → 响应
```

### 2. **用户认证流程**
```
前端 → JWT Token → 认证中间件 → 用户验证 → 权限检查 → 业务处理
```

### 3. **数据同步流程**
```
本地状态 → API调用 → 后端处理 → 数据库更新 → 响应返回 → 状态更新
```

## 🔐 安全设计

### 前端安全
- **环境变量**: 敏感配置通过环境变量管理
- **Token管理**: 安全的JWT存储和刷新机制
- **输入验证**: 客户端输入验证和清理

### 后端安全
- **API密钥**: 外部API密钥服务器端保护
- **认证授权**: JWT + 中间件认证
- **输入验证**: 服务器端严格验证
- **限流保护**: Rate limiting防止滥用
- **CORS配置**: 跨域请求安全控制

## 📊 性能优化

### 前端优化
- **状态缓存**: Zustand本地状态管理
- **请求缓存**: API响应缓存策略
- **懒加载**: 组件和路由懒加载
- **图片优化**: 图片压缩和缓存

### 后端优化
- **数据库索引**: 查询性能优化
- **缓存策略**: Redis/内存缓存
- **连接池**: 数据库连接池管理
- **压缩**: 响应数据压缩

## 🚀 部署架构

### 开发环境
```
前端: Expo Dev Server (localhost:8081)
后端: Express Dev Server (localhost:3000)
数据库: MongoDB Atlas (云端)
```

### 生产环境
```
前端: Expo EAS Build → App Store/Google Play
后端: Docker → 云服务器 (AWS/GCP/Azure)
数据库: MongoDB Atlas (生产集群)
CDN: 静态资源加速
```

## 📈 扩展性设计

### 水平扩展
- **负载均衡**: 多实例部署
- **数据库分片**: MongoDB分片集群
- **缓存集群**: Redis集群

### 功能扩展
- **微服务**: 按功能模块拆分
- **消息队列**: 异步任务处理
- **实时通信**: WebSocket支持

## 🔧 开发工具

### 前端开发
- **Expo CLI**: 开发和构建工具
- **TypeScript**: 类型检查和开发体验
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

### 后端开发
- **Nodemon**: 开发热重载
- **TypeScript**: 类型安全
- **ESLint**: 代码规范
- **Jest**: 单元测试

## 📝 API文档

### 统一响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### 主要API端点
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

## 🎯 迁移策略

### 阶段1: 基础架构搭建
1. 创建独立的前后端项目
2. 配置开发环境和工具链
3. 实现基础API和客户端

### 阶段2: 核心功能迁移
1. 迁移单词查询功能
2. 实现用户认证系统
3. 迁移数据存储逻辑

### 阶段3: 功能增强
1. 添加缓存和优化
2. 实现实时通知
3. 添加监控和日志

### 阶段4: 生产部署
1. 配置生产环境
2. 性能测试和优化
3. 监控和告警设置

## 📚 最佳实践

### 代码组织
- 清晰的目录结构
- 单一职责原则
- 依赖注入模式
- 错误处理统一

### 安全实践
- 输入验证和清理
- 认证授权检查
- 敏感信息保护
- 定期安全审计

### 性能实践
- 数据库查询优化
- 缓存策略应用
- 异步处理
- 资源压缩

这种前后端分离架构为Dramaword提供了更好的可维护性、安全性和扩展性，为未来的功能扩展和性能优化奠定了坚实的基础。 