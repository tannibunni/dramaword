# 🔄 Dramaword 项目迁移指南

## 📋 迁移概述

本文档详细说明如何将现有的单体架构项目迁移到前后端分离架构。

## 🏗️ 迁移前后对比

### 迁移前 (单体架构)
```
Dramaword/
├── app/                    # 页面路由
├── components/             # UI组件
├── services/               # 业务逻辑 + API调用
├── types/                  # 类型定义
├── hooks/                  # 自定义Hooks
├── assets/                 # 静态资源
└── package.json           # 项目依赖
```

### 迁移后 (前后端分离)
```
Dramaword/
├── mobile/                 # 前端项目
│   ├── src/
│   │   ├── app/           # 页面路由
│   │   ├── components/    # UI组件
│   │   ├── services/      # API客户端
│   │   ├── stores/        # 状态管理
│   │   ├── types/         # 类型定义
│   │   ├── hooks/         # 自定义Hooks
│   │   └── assets/        # 静态资源
│   └── package.json
├── api/                    # 后端项目
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由
│   │   └── config/        # 配置
│   └── package.json
└── docs/                   # 项目文档
```

## 📁 文件迁移清单

### 前端文件迁移 (mobile/)

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `app/` | `mobile/src/app/` | 页面路由 |
| `components/` | `mobile/src/components/` | UI组件 |
| `hooks/` | `mobile/src/hooks/` | 自定义Hooks |
| `assets/` | `mobile/src/assets/` | 静态资源 |
| `package.json` | `mobile/package.json` | 项目依赖 |
| `app.json` | `mobile/app.json` | Expo配置 |
| `tsconfig.json` | `mobile/tsconfig.json` | TypeScript配置 |
| `babel.config.js` | `mobile/babel.config.js` | Babel配置 |

### 后端文件迁移 (api/)

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `services/` | `api/src/services/` | 业务逻辑服务 |
| `types/` | `api/src/types/` | 类型定义 |
| `app/api/` | `api/src/routes/` | API路由 |

### 新增文件

#### 前端新增
- `mobile/src/services/apiClient.ts` - HTTP客户端
- `mobile/src/services/wordService.ts` - 简化的单词服务
- `mobile/src/stores/wordStore.ts` - Zustand状态管理
- `mobile/env.example` - 环境变量示例

#### 后端新增
- `api/src/index.ts` - 服务器入口
- `api/src/controllers/` - 控制器层
- `api/src/models/` - 数据模型
- `api/src/middleware/` - 中间件
- `api/src/config/` - 配置文件
- `api/Dockerfile` - Docker配置
- `api/env.example` - 环境变量示例

## 🔧 迁移步骤

### 阶段1: 项目结构重组

1. **创建新目录结构**
```bash
mkdir -p mobile/src/{app,components,services,stores,types,hooks,assets}
mkdir -p api/src/{controllers,services,models,middleware,routes,types,config}
```

2. **移动前端文件**
```bash
# 移动页面路由
cp -r app/* mobile/src/app/

# 移动组件
cp -r components/* mobile/src/components/

# 移动Hooks
cp -r hooks/* mobile/src/hooks/

# 移动静态资源
cp -r assets/* mobile/src/assets/

# 移动配置文件
cp package.json mobile/
cp app.json mobile/
cp tsconfig.json mobile/
cp babel.config.js mobile/
```

3. **移动后端文件**
```bash
# 移动服务文件
cp -r services/* api/src/services/

# 移动类型定义
cp -r types/* api/src/types/

# 移动API路由
cp app/api/* api/src/routes/
```

### 阶段2: 代码重构

#### 前端重构

1. **简化服务层**
```typescript
// 原 services/wordService.ts (复杂业务逻辑)
// ↓ 重构为
// mobile/src/services/wordService.ts (API调用)
```

2. **添加状态管理**
```typescript
// 新增 mobile/src/stores/wordStore.ts
// 使用Zustand管理本地状态
```

3. **统一API客户端**
```typescript
// 新增 mobile/src/services/apiClient.ts
// 统一的HTTP请求处理
```

#### 后端重构

1. **控制器层**
```typescript
// 新增 api/src/controllers/wordController.ts
// 处理HTTP请求和响应
```

2. **数据模型**
```typescript
// 新增 api/src/models/Word.ts
// Mongoose数据模型
```

3. **中间件**
```typescript
// 新增 api/src/middleware/auth.ts
// JWT认证中间件
```

### 阶段3: 环境配置

1. **前端环境变量**
```bash
# 复制环境变量示例
cp mobile/env.example mobile/.env

# 配置API地址
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

2. **后端环境变量**
```bash
# 复制环境变量示例
cp api/env.example api/.env

# 配置数据库和API密钥
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### 阶段4: 依赖管理

1. **前端依赖更新**
```bash
cd mobile
npm install axios zustand
```

2. **后端依赖安装**
```bash
cd api
npm install express mongoose jsonwebtoken cors helmet
npm install -D @types/express @types/node typescript
```

## 🔄 数据流变化

### 迁移前
```
前端组件 → 服务层 → 外部API/本地存储
```

### 迁移后
```
前端组件 → 状态管理 → API客户端 → 后端API → 数据库/外部API
```

## 🧪 测试验证

### 前端测试
```bash
cd mobile
npm run dev
# 验证页面正常加载
# 验证API调用正常
```

### 后端测试
```bash
cd api
npm run dev
# 验证服务器启动
# 验证数据库连接
# 测试API端点
```

### 集成测试
```bash
# 启动前后端服务
cd mobile && npm run dev &
cd api && npm run dev &

# 测试完整流程
# 1. 前端页面加载
# 2. API调用
# 3. 数据返回
# 4. 状态更新
```

## 🚨 注意事项

### 1. 环境变量
- 确保敏感信息不提交到Git
- 使用.env文件管理配置
- 区分开发和生产环境

### 2. API兼容性
- 保持API接口向后兼容
- 逐步迁移，避免一次性大改动
- 添加版本控制机制

### 3. 数据迁移
- 备份现有数据
- 测试数据迁移脚本
- 验证数据完整性

### 4. 性能优化
- 监控API响应时间
- 优化数据库查询
- 添加缓存策略

## 📊 迁移检查清单

- [ ] 项目结构重组完成
- [ ] 前端代码重构完成
- [ ] 后端代码重构完成
- [ ] 环境变量配置完成
- [ ] 依赖安装完成
- [ ] 前端功能测试通过
- [ ] 后端功能测试通过
- [ ] 集成测试通过
- [ ] 文档更新完成
- [ ] 部署配置完成

## 🎯 后续优化

1. **性能优化**
   - 添加Redis缓存
   - 优化数据库查询
   - 实现CDN加速

2. **功能增强**
   - 添加实时通知
   - 实现离线同步
   - 增加数据分析

3. **安全加固**
   - 添加API限流
   - 实现审计日志
   - 加强数据加密

4. **监控告警**
   - 集成错误监控
   - 添加性能监控
   - 设置告警机制

---

这个迁移指南确保了项目从单体架构平滑过渡到前后端分离架构，同时保持了功能的完整性和稳定性。 