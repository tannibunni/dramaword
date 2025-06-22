#!/bin/bash

# 自动IP检测和更新脚本
# 用于在开发环境中自动检测后端服务器IP并更新配置

echo "🔍 开始自动IP检测..."

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📱 本机IP: $LOCAL_IP"

# 检测常见的IP段
COMMON_IPS=(
    "192.168.1.100" "192.168.1.101" "192.168.1.102" "192.168.1.103"
    "192.168.0.100" "192.168.0.101" "192.168.0.102" "192.168.0.103"
    "192.168.2.100" "192.168.2.101" "192.168.2.102" "192.168.2.103"
    "10.0.0.100" "10.0.0.101" "10.0.0.102" "10.0.0.103"
    "10.3.104.115" "10.3.104.116" "10.3.104.117" "10.3.104.118"
)

# 检测后端服务器
BACKEND_IP=""
for ip in "${COMMON_IPS[@]}"; do
    echo "🔍 检测 $ip:3000..."
    if curl -s --connect-timeout 2 "http://$ip:3000/health" > /dev/null; then
        echo "✅ 找到后端服务器: $ip"
        BACKEND_IP=$ip
        break
    fi
done

if [ -z "$BACKEND_IP" ]; then
    echo "❌ 未找到后端服务器"
    echo "请确保后端服务器正在运行，或者手动设置IP地址"
    exit 1
fi

# 更新环境变量文件
ENV_FILE="mobile/.env"
if [ -f "$ENV_FILE" ]; then
    # 备份原文件
    cp "$ENV_FILE" "$ENV_FILE.backup"
    
    # 更新API URL
    sed -i.bak "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$BACKEND_IP:3000/api|" "$ENV_FILE"
    
    echo "✅ 已更新 $ENV_FILE"
    echo "📝 API URL: http://$BACKEND_IP:3000/api"
else
    echo "⚠️ 未找到 .env 文件，创建新文件..."
    cat > "$ENV_FILE" << EOF
# API配置
EXPO_PUBLIC_API_URL=http://$BACKEND_IP:3000/api

# 应用配置
EXPO_PUBLIC_APP_NAME=DramaWord
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=info

# 功能开关
EXPO_PUBLIC_ENABLE_CELEBRATION=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EOF
    echo "✅ 已创建 $ENV_FILE"
fi

echo "🎉 IP检测和配置更新完成！"
echo "📱 本机IP: $LOCAL_IP"
echo "🖥️  后端IP: $BACKEND_IP"
echo "🔗 API地址: http://$BACKEND_IP:3000/api" 