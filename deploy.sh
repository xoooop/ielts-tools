#!/bin/bash
# IELTS Tools 一键部署脚本 — 在宝塔面板终端执行
# 使用方法：复制此脚本内容，粘贴到宝塔面板终端运行

set -e

echo "========================================"
echo " IELTS Tools 一键部署"
echo "========================================"

# 1. 安装 Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "[1/6] 安装 Node.js 20.x..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 2. 安装 PM2（进程守护）
if ! command -v pm2 &> /dev/null; then
    echo "[2/6] 安装 PM2..."
    npm install -g pm2
fi

# 3. 创建项目目录
APP_DIR=/www/wwwroot/ielts-h5
mkdir -p $APP_DIR
cd $APP_DIR
echo "[3/6] 项目目录: $APP_DIR"

# 4. 从本地上传或 git clone 项目文件
# 这里需要你手动上传项目文件到 $APP_DIR
echo "[4/6] 请将项目文件上传到 $APP_DIR"
echo "   方法1: 在宝塔面板 → 文件 → 上传 .next, package.json, public/ 等"
echo "   方法2: 使用 scp 上传"
echo ""
echo "继续前请确认以下文件已就位："
echo "  $APP_DIR/package.json"
echo "  $APP_DIR/.next/"
echo "  $APP_DIR/public/"
echo "  $APP_DIR/data/"
echo ""

read -p "文件已上传？按回车继续..."

# 5. 安装依赖并构建
echo "[5/6] 安装生产依赖..."
cd $APP_DIR
npm install --production 2>/dev/null || npm install

# 创建 .env.local
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_ENCRYPTION_SALT=ielts-h5-prod-$(date +%s)" > .env.local
    echo "RATE_LIMIT_MAX=30" >> .env.local
fi

# 6. 启动服务
echo "[6/6] 启动服务..."
pm2 delete ielts-h5 2>/dev/null || true
pm2 start npm --name ielts-h5 -- start -- -p 3000
pm2 save
pm2 startup

echo ""
echo "========================================"
echo " 部署完成！"
echo "========================================"
echo " 访问地址: http://$(curl -s ifconfig.me):3000"
echo ""
echo " 管理命令:"
echo "   pm2 status         查看状态"
echo "   pm2 logs ielts-h5   查看日志"
echo "   pm2 restart ielts-h5 重启"
echo ""
echo " 下一步:"
echo "  1. 宝塔面板 → 网站 → 添加站点 → 绑定域名"
echo "  2. 设置反向代理: 目标URL http://127.0.0.1:3000"
echo "  3. 申请 SSL 证书"
echo "========================================"
