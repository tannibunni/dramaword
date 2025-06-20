# 📱 Dramaword Mobile - 前端应用

## 📋 项目概述

Dramaword Mobile 是基于 React Native + Expo 开发的跨平台词汇学习应用前端。

## 🏗️ 项目结构

```
mobile/
├── src/
│   ├── app/              # Expo Router 页面路由
│   │   ├── (tabs)/       # 标签页路由
│   │   ├── _layout.tsx   # 根布局
│   │   └── +not-found.tsx # 404页面
│   ├── components/       # UI组件
│   │   ├── WordCard.tsx  # 单词卡片
│   │   ├── SearchBar.tsx # 搜索栏
│   │   ├── AudioPlayer.tsx # 音频播放器
│   │   └── ...          # 其他组件
│   ├── services/         # API客户端服务
│   │   ├── apiClient.ts  # HTTP客户端
│   │   └── wordService.ts # 单词服务
│   ├── stores/           # 状态管理
│   │   └── wordStore.ts  # 单词状态管理
│   ├── types/            # TypeScript类型定义
│   │   └── word.ts       # 单词相关类型
│   ├── hooks/            # 自定义Hooks
│   │   └── useFrameworkReady.ts
│   └── assets/           # 静态资源
│       └── images/       # 图片资源
├── package.json          # 项目依赖
├── app.json             # Expo配置
├── tsconfig.json        # TypeScript配置
└── babel.config.js      # Babel配置
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Expo CLI

### 安装依赖
```bash
npm install
```

### 环境变量配置
创建 `.env` 文件：
```env
# API配置
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# 其他配置
EXPO_PUBLIC_APP_NAME=Dramaword
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 启动开发服务器
```bash
npm run dev
```

### 构建应用
```bash
# Web版本
npm run build:web

# iOS版本
npm run build:ios

# Android版本
npm run build:android
```

## 📱 功能模块

### 1. 查词模块
- 多源数据聚合查询
- 音频播放功能
- 单词保存到词库

### 2. 单词表模块
- 个人词库管理
- 学习进度追踪
- 里程碑系统

### 3. 复习模块
- 智能复习算法
- 学习统计
- 复习引导

### 4. 统计模块
- 学习数据分析
- 云端同步状态
- 用户设置

## 🛠️ 技术特性

- **跨平台**: iOS、Android、Web 三端支持
- **类型安全**: 完整的 TypeScript 类型定义
- **状态管理**: 使用 Zustand 简化状态管理
- **API集成**: 统一的 HTTP 客户端
- **离线支持**: 本地缓存和状态持久化
- **动画效果**: React Native Reanimated 流畅动画

## 🔧 开发工具

- **Expo CLI**: 开发和构建工具
- **TypeScript**: 类型检查和开发体验
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

## 📚 相关文档

- [架构设计](../ARCHITECTURE.md)
- [部署指南](../DEPLOYMENT.md)
- [API文档](../docs/) 