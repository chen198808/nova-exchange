#!/bin/bash
set -e

echo "=== 正在更新代码... ==="
git pull origin main

echo ""
echo "=== 安装前端依赖... ==="
npm install

echo ""
echo "=== 安装后端依赖... ==="
cd server
npm install
cd ..

echo ""
echo "=== 清理旧构建... ==="
rm -rf dist
rm -rf server/dist

echo ""
echo "=== 构建前端... ==="
npm run build

echo ""
echo "=== 构建后端... ==="
cd server
npm run build
cd ..

echo ""
echo "=== 启动服务器... ==="
cd server
npm start
