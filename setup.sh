#!/bin/bash
set -e

echo "========================================"
echo "  Telegram Media Engine - Auto Setup"
echo "  (For Ubuntu/Debian & Termux PRoot)"
echo "========================================"

echo "[1/6] Updating package lists..."
apt-get update -y

echo "[2/6] Installing OS dependencies (ffmpeg, aria2, python3, etc.)..."
apt-get install -y ffmpeg aria2 python3 python3-pip curl wget

echo "[3/6] Installing yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "[4/6] Installing Node.js project dependencies..."
npm install

echo "[5/6] Installing Playwright Chromium & OS Dependencies..."
# Install the browser itself
npx playwright install chromium
# Install the required Linux shared libraries to run Chromium
npx playwright install-deps chromium

echo "[6/6] Setup Complete!"
echo "========================================"
echo "Next steps:"
echo "1. Verify your '.env' file contains the correct TELEGRAM_API_ID and TELEGRAM_API_HASH."
echo "2. Start the bot for the first time to login:"
echo "   npm run dev"
