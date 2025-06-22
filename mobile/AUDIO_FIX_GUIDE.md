# 音频播放问题修复指南

## 🎵 问题描述

在隧道模式下，移动应用遇到音频播放错误：
```NotSupportedError: Failed to load because no supported source was found
```

## 🔍 问题原因

1. **IP地址问题**：音频URL使用 `localhost:3000`，但移动设备无法访问开发机器的localhost
2. **网络连接**：隧道模式下，移动应用需要正确的IP地址来访问后端API
3. **音频格式**：Google TTS返回的音频格式可能不被某些设备支持

## ✅ 解决方案

### 1. 修复音频URL生成

**文件**: `api/src/controllers/wordController.ts`

```typescript
// 修改前
audioUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/words/${wordText}/audio`,

// 修改后
audioUrl: `${req.protocol}://${req.get('host')}/api/words/${wordText}/audio`,
```

### 2. 更新API客户端配置

**文件**: `mobile/src/services/apiClient.ts`

```typescript
// 隧道模式下，使用IP地址而不是localhost
return 'http://192.168.0.233:3000/api';
```

### 3. 改进错误处理

**文件**: `mobile/src/components/AudioPlayer.tsx`

- 添加音频URL验证
- 改进错误消息
- 增加调试信息

## 🔧 验证步骤

### 1. 测试音频API
```bash
curl -I http://localhost:3000/api/words/test/audio
```

### 2. 测试单词查询
```bash
curl -s "http://localhost:3000/api/words/apple" | jq '.audioUrl'
```

### 3. 测试IP地址访问
```bash
curl -H "Host: 192.168.0.233:3000" -s "http://localhost:3000/api/words/banana" | jq '.audioUrl'
```

## 📱 使用说明

1. **重启服务**：确保后端API和Expo隧道模式都在运行
2. **重新加载应用**：在移动应用中重新加载以获取新配置
3. **测试音频**：点击单词旁边的音频图标测试播放

## 🐛 故障排除

### 如果仍然无法播放：

1. **检查网络连接**：确保手机和电脑在同一网络
2. **验证IP地址**：确认使用正确的IP地址
3. **查看控制台**：检查移动应用的控制台输出
4. **测试API**：直接访问音频URL测试是否可访问

### 常见错误：

- `no supported source was found`：音频格式不支持或URL无效
- `network error`：网络连接问题
- `timeout`：请求超时

## 📋 技术细节

- **音频源**：Google TTS (translate.google.com)
- **音频格式**：MP3
- **代理方式**：后端API代理Google TTS请求
- **缓存策略**：1天缓存时间

## 🎯 预期结果

修复后，移动应用应该能够：
- ✅ 正确生成音频URL
- ✅ 成功播放单词发音
- ✅ 在隧道模式下正常工作
- ✅ 提供清晰的错误信息 