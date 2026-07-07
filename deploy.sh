#!/bin/bash
set -e

echo "=== Building frontend ==="
npm run build

echo "=== Copying frontend to server dist ==="
rm -rf server/dist/dist
cp -r dist server/dist/dist

echo "=== Building server ==="
cd server && npm run build && cd ..

echo "=== Build complete ==="
ls -la server/dist/
