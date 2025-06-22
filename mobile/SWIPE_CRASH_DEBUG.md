# 右滑闪退调试指南

## 🚨 问题描述

右滑保存单词时仍然出现闪退，需要进一步调试。

## 🔍 调试步骤

### 1. 查看控制台日志

在移动应用中右滑保存时，查看控制台是否有以下日志：

```
🎴 WordCard: Component rendered with word: [单词名]
🎴 WordCard: Component mounted
🎯 Gesture: onStart triggered
🎯 Gesture: onActive - processing swipe
🎯 Gesture: onActive - progress: [数值] translateX: [数值]
🎯 Gesture: onEnd triggered, translationX: [数值]
🎯 Gesture: onEnd - shouldSave: true
🎯 Gesture: onEnd - executing save animation
🎯 Gesture: onEnd - calling saveWordToVocabulary
💾 Starting to save word: [单词名]
```

### 2. 使用测试按钮

如果右滑有问题，可以：
1. 翻转卡片到背面
2. 点击右上角的"测试保存"按钮
3. 查看是否能正常保存

### 3. 检查错误信息

如果出现闪退，请查看：
- 控制台错误信息
- 网络请求状态
- 后端服务器日志

## 🐛 可能的问题

### 问题1: 手势处理器错误
**症状**: 控制台显示手势相关错误
**解决**: 检查 `react-native-gesture-handler` 是否正确安装

### 问题2: 动画错误
**症状**: 控制台显示动画相关错误
**解决**: 检查 `react-native-reanimated` 是否正确配置

### 问题3: 网络请求错误
**症状**: 保存时网络请求失败
**解决**: 检查API地址和网络连接

### 问题4: 数据格式错误
**症状**: 单词数据格式不正确
**解决**: 检查单词对象结构

## 🔧 临时解决方案

### 1. 使用测试按钮
如果右滑有问题，暂时使用测试按钮保存单词。

### 2. 检查依赖
确保以下依赖正确安装：
```bash
npm install react-native-gesture-handler react-native-reanimated
```

### 3. 重启应用
完全关闭并重新打开移动应用。

## 📱 测试步骤

1. **搜索单词** → 在首页搜索一个单词
2. **翻转卡片** → 轻触卡片查看背面
3. **尝试右滑** → 在背面向右滑动
4. **使用测试按钮** → 如果右滑失败，点击测试按钮
5. **查看日志** → 检查控制台输出

## 🎯 预期结果

### 成功情况
- ✅ 右滑动画流畅
- ✅ 保存成功提示
- ✅ 单词出现在词汇页面
- ✅ 控制台显示完整日志

### 失败情况
- ❌ 应用闪退
- ❌ 动画卡住
- ❌ 保存失败
- ❌ 控制台显示错误

## 📋 需要提供的信息

如果问题仍然存在，请提供：

1. **完整的控制台日志**
2. **具体的错误信息**
3. **使用的设备信息**
4. **Expo版本信息**
5. **依赖版本信息**

## 🔄 下一步

根据调试结果，我们可以：
1. 进一步简化手势逻辑
2. 修复特定的错误
3. 提供替代的保存方式
4. 更新相关依赖 