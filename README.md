# OpenCode NVIDIA Sync

Automatically tests every NVIDIA NIM model and updates your OpenCode whitelist with only the fastest working models.

## Features

- Fetches all NVIDIA models
- Tests every model
- Measures latency
- Keeps only the fastest `TOP_MODELS`
- Caches results for 6 hours
- Updates OpenCode whitelist
- Creates a backup before modifying config
- Configurable concurrency and timeout
- Supports `--dry-run`

---

## Installation

```bash
npm install
```

Create a `.env`

```env
NVIDIA_API_KEY=YOUR_API_KEY

NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

OPENCODE_CONFIG=/home/user/.config/opencode/config.json

CONCURRENCY=5

TIMEOUT=12000

TOP_MODELS=15
```

Run

```bash
npm start
```

Preview without changing OpenCode config:

```bash
npm start -- --dry-run
```

---

## Example Output

```text
Fetching NVIDIA models...

Found 67 models

Testing...

✅ meta/llama-3.3-70b-instruct        842ms
✅ qwen/qwen3-coder-480b              920ms
❌ deepseek/deepseek-v3               AbortError

Working : 52
Failed  : 15

Whitelist updated successfully.
```

---

## What Changes?

Before:

```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

After:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "nvidia": {
      "whitelist": [
        "meta/llama-3.3-70b-instruct",
        "qwen/qwen3-coder-480b"
      ]
    }
  }
}
```

A backup of the original config is created as:

```text
config.json.bak
```

The cache file looks like this:

```json
{
  "lastRun": "2026-07-14T09:00:00.000Z",
  "working": [
    "meta/llama-3.3-70b-instruct",
    "qwen/qwen3-coder-480b"
  ]
}
```

---

## Requirements

- Node.js 20+
- NVIDIA API Key
- OpenCode
