# 保存单词功能调试指南

## 🎯 问题描述

首页单词卡右滑保存时出现闪退，需要实现：
1. 用户单词表计数+1
2. 单词被记录在用户单词本里

## 🔍 调试步骤

### 1. 检查控制台输出

在移动应用中右滑保存单词时，查看控制台是否有以下日志：

```
💾 Starting to save word: [单词名]
💾 Word data validation passed
💾 Word object: {...}
💾 WordService: Starting to save word: [单词名]
💾 WordService: Word data: {...}
✅ WordService: Word saved successfully: [单词名]
✅ Word saved to backend: {...}
💾 Calling onWordSaved callback
✅ Word saved successfully: [单词名]
```

### 2. 检查网络请求

在浏览器开发者工具或移动应用调试工具中查看网络请求：

```
POST http://192.168.0.233:3000/api/words
Content-Type: application/json
```

### 3. 检查后端日志

在后端服务器控制台查看是否有以下日志：

```
💾 Saving new word: "[单词名]"
✅ Word saved successfully: "[单词名]"
```

## 🐛 常见问题

### 问题1: 网络连接错误
**症状**: 控制台显示网络错误
**解决**: 检查API地址是否正确，确保使用 `192.168.0.233:3000`

### 问题2: 单词数据格式错误
**症状**: 控制台显示 "Invalid word data"
**解决**: 检查单词对象是否包含必要字段

### 问题3: 后端保存失败
**症状**: 后端日志显示保存错误
**解决**: 检查数据库连接和MongoDB状态

### 问题4: 回调函数错误
**症状**: 控制台显示 "onWordSaved callback error"
**解决**: 检查回调函数实现

## ✅ 验证方法

### 1. 测试API端点
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"word":"test","pronunciation":"test","meanings":[{"partOfSpeech":"noun","definitionCn":"测试"}]}' \
  http://localhost:3000/api/words
```

### 2. 检查单词表
```bash
curl http://localhost:3000/api/words/user
```

### 3. 检查特定单词
```bash
curl http://localhost:3000/api/words/test
```

## 🔧 修复措施

### 1. 已完成的修复
- ✅ 添加了详细的错误处理
- ✅ 添加了调试日志
- ✅ 修复了回调函数问题
- ✅ 验证了API端点

### 2. 预期结果
- ✅ 右滑保存不再闪退
- ✅ 单词成功保存到数据库
- ✅ 用户单词表计数增加
- ✅ 显示保存成功提示

## 📱 使用说明

1. **右滑保存**: 在单词卡背面向右滑动超过阈值
2. **保存动画**: 卡片会向右滑出并显示保存动画
3. **成功提示**: 显示"保存成功"的Alert提示
4. **单词表更新**: 单词会出现在词汇页面

## 🎯 下一步

如果问题仍然存在，请：
1. 查看完整的控制台输出
2. 检查网络请求状态
3. 查看后端服务器日志
4. 提供具体的错误信息 