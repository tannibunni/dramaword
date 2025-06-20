# API 配置说明

## 查词聚合功能配置

本系统实现了完整的查词聚合逻辑：

```
[用户查词 "tell"]
     ↓
[前端调用后端 API: /api/words/tell]
     ↓
[后端查 MongoDB 是否已有结果]
     ↓（无则进入数据生成流程）
1️⃣ 有道 API      → 获取中文释义 + 音标
2️⃣ Free Dictionary API → 获取英文释义 + 发音 + 例句
3️⃣ OpenAI GPT    → 生成结构化：每义项例句 + 衍生词 + 同义词
     ↓
[合并数据结构 → 存入数据库]
     ↓
[返回结构化词卡 JSON 给前端渲染]
```

## 需要配置的 API

### 1. 有道翻译 API（必需）

**获取方式：**
1. 访问 [有道智云](https://ai.youdao.com/)
2. 注册账号并创建应用
3. 获取 `应用ID` 和 `应用密钥`

**配置环境变量：**
```bash
YOUDAO_APP_KEY=your_youdao_app_key
YOUDAO_APP_SECRET=your_youdao_app_secret
```

### 2. OpenAI GPT API（必需）

**获取方式：**
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号并获取 API Key
3. 确保账户有足够的余额

**配置环境变量：**
```bash
OPENAI_API_KEY=your_openai_api_key
```

### 3. Free Dictionary API（免费，无需配置）

- 无需 API Key
- 自动获取英文释义、发音、例句

## 配置步骤

1. **复制环境变量文件：**
   ```bash
   cp api/env.example api/.env
   ```

2. **编辑 `.env` 文件，填入你的 API Key：**
   ```bash
   # 有道翻译 API
   YOUDAO_APP_KEY=your_actual_youdao_app_key
   YOUDAO_APP_SECRET=your_actual_youdao_app_secret
   
   # OpenAI API
   OPENAI_API_KEY=your_actual_openai_api_key
   ```

3. **重启后端服务：**
   ```bash
   cd api && npm run dev
   ```

## 功能特点

- ✅ **真实 API 数据**：不再使用 Mock 数据
- ✅ **智能聚合**：三个 API 数据智能合并
- ✅ **错误兜底**：API 失败时有降级处理
- ✅ **缓存机制**：查询过的单词直接返回
- ✅ **完整结构**：音标、翻译、例句、衍生词、同义词

## 测试

配置完成后，可以测试查词功能：

```bash
curl http://localhost:3000/api/words/hello
```

应该返回包含真实 API 数据的完整词卡信息。 