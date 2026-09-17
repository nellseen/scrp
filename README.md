# Telegram Media Processing Engine

A robust, headless Telegram Userbot and Backend Media Processing system. This system acts as a reliable pipeline to detect media URLs sent to your userbot, validate them, extract the direct source using multiple fallback strategies, download them concurrently, validate the integrity of the downloaded file, and upload the final result back to Telegram.

## Core Features

- **Headless Userbot**: Automatically detects and processes URLs sent in Telegram chats.
- **Persistent State**: SQLite-based queue and session persistence ensuring no tasks are lost across restarts.
- **Resolver Orchestrator**: Uses `yt-dlp`, Direct HTTP probes, HLS/DASH manifest parsers, and a Headless Playwright browser fallback to extract media streams.
- **Downloader Engine**: Gracefully degrades from `yt-dlp` to `aria2c` for reliable chunked downloading.
- **Process Watchdog**: Monitors external tools (`ffmpeg`, `yt-dlp`) with timeouts and stall detection to prevent hanging processes.
- **Media Validation**: Uses `ffprobe` to ensure the final media is valid before attempting an upload.
- **SSRF Protection**: Prevents malicious users from forcing the bot to access internal networks.
- **Control Bot**: An optional standard Telegram bot interface for administrators to monitor queue status.

## Prerequisites

The system relies on external binaries for robust media handling. Ensure the following are installed on your host system:

*   **Node.js** (v18+)
*   **FFmpeg & FFprobe**: For media validation and thumbnail extraction.
*   **Aria2**: For fast, concurrent downloading (`aria2c`).
*   **yt-dlp**: For resolving and downloading from hundreds of supported sites.
*   **Python 3**: Often required by external extraction tools.

### Automated Setup (Termux PRoot / Ubuntu / Debian)

If you are running on Termux (with an Ubuntu PRoot distro) or any Debian-based Linux, you can run the automated setup script to install all OS dependencies, Playwright browsers, and configure the project.

\`\`\`bash
chmod +x setup.sh
./setup.sh
\`\`\`

If you use the automated setup, you can skip to **Step 3 (Environment Configuration)** below.

### Manual Installation (Linux/Debian)

\`\`\`bash
sudo apt-get update
sudo apt-get install -y ffmpeg aria2 python3 python3-pip curl

# Install latest yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
\`\`\`

## Setup Instructions

### 1. Clone & Install Node Dependencies

\`\`\`bash
# Install NPM packages
npm install
\`\`\`

### 2. Install Playwright Browsers

Playwright is used as an ultimate fallback to execute JavaScript on complex pages and sniff out media requests.

\`\`\`bash
npx playwright install chromium
\`\`\`

### 3. Environment Configuration

Copy the example environment file and configure your credentials.

\`\`\`bash
cp .env.example .env
\`\`\`

Edit the `.env` file. You will need:
- `TELEGRAM_API_ID` & `TELEGRAM_API_HASH`: Get these by creating an application at [my.telegram.org](https://my.telegram.org).
- `BOT_TOKEN` & `ADMIN_ID` (Optional): For the administrative Control Bot.
- See `.env.example` for tuning storage limits and concurrency.

### 4. Build the Project

\`\`\`bash
npm run build
\`\`\`

### 5. First Run & Authentication

Because this is a Userbot, the first time you run it, you must authenticate with your Telegram account via the terminal prompt.

\`\`\`bash
npm run dev
\`\`\`

1. The console will prompt: `Please enter your number:`
2. Enter your phone number in international format (e.g., `+1234567890`).
3. Telegram will send a login code to your Telegram app.
4. The console will prompt: `Please enter the code you received:`
5. Enter the code. (If you have 2FA enabled, it will also ask for your password).

Once successfully logged in, the session is saved securely in the local SQLite database (`data/app.db`). You will not need to authenticate again unless the session is revoked.

### 6. Production Deployment

Once the session is created and the bot is successfully running, you can stop the dev server and run the optimized production bundle:

\`\`\`bash
npm run start
\`\`\`

## Architecture & Workflows

1. **Intake**: The userbot listens for messages. If a URL is detected, it passes through SSRF validation.
2. **Queue**: The URL is queued in SQLite. The queue manager runs up to `CONCURRENCY_LIMIT` tasks simultaneously.
3. **Resolution**: The `ResolverOrchestrator` runs. It tries `yt-dlp`, then standard HTTP checks, then HLS/DASH parsers, and finally `Playwright` to extract the raw media manifest.
4. **Download**: The `DownloadOrchestrator` takes the raw media candidate and attempts to download it using `yt-dlp` or `aria2c`.
5. **Processing**: `ffprobe` validates the integrity of the downloaded file. If valid, a thumbnail is generated.
6. **Upload**: The validated media is uploaded back to the chat where the URL was originally sent.

## Admin Commands

If you configured `BOT_TOKEN` and `ADMIN_ID`, you can message your Control Bot:
- `/status` - View all active tasks, their states, and current processing phases.
