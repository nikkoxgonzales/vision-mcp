# vision-mcp

An MCP (Model Context Protocol) server that gives Claude and other MCP
clients **vision**: screenshot → UI code, OCR, error-diagnosis, diagram
analysis, data-viz insights, UI diff checks, and video analysis.

Vendored from [@z_ai/mcp-server](https://www.npmjs.com/package/@z_ai/mcp-server)
by **Z.AI** (Apache-2.0) and extended to be **provider-agnostic** — point
it at any OpenAI-compatible vision endpoint with base URL + model + API
key.

## Status

Working. All 8 tools verified booting over MCP stdio (see `build/`).
Version 0.1.4 (upstream).

## What it does

Eight tools cover image and video analysis:

| Tool | What it does |
|---|---|
| `ui_to_artifact` | Convert UI screenshots into frontend code, AI prompts, design specs |
| `extract_text_from_screenshot` | OCR: code, terminal output, logs, docs from screenshots |
| `diagnose_error_screenshot` | Analyze error messages/stack traces, suggest fixes |
| `understand_technical_diagram` | Explain architecture, flowchart, UML, ER diagrams |
| `analyze_data_visualization` | Insights from charts and graphs |
| `ui_diff_check` | Visual regression: expected vs actual UI |
| `analyze_image` | General-purpose image analysis (fallback) |
| `analyze_video` | Video content analysis (URL or local file; local file ≤8MB, ZAI/Zhipu only) |

## Install

Requires Node.js 18+.

**Easiest — no clone, no npm publish.** `npx` runs the server straight
from the GitHub repo (cached after the first run):

```sh
npx -y github:nikkoxgonzales/vision-mcp
```

Or clone and install locally:

```sh
git clone https://github.com/nikkoxgonzales/vision-mcp.git
cd vision-mcp
npm install
```

## Usage

Three environment variables configure the server. `AI_API_KEY` is
required; `AI_BASE_URL` and `AI_VISION_MODEL` select the provider and
model.

| Variable | Required | Description |
|---|---|---|
| `AI_API_KEY` | Yes | API key for the provider |
| `AI_BASE_URL` | No | OpenAI-compatible base URL (e.g. `https://api.openai.com/v1/`). Default: Zhipu or Z.AI preset via `AI_MODE`. |
| `AI_VISION_MODEL` | No | Vision model name (default: `glm-4.6v`) |

Convenience presets via `AI_MODE` (or `PLATFORM_MODE`) fill in
`AI_BASE_URL` when it isn't set: `ZAI` → `https://api.z.ai/api/paas/v4/`,
`ZHIPU` (default) → `https://open.bigmodel.cn/api/paas/v4/`. An explicit
`AI_BASE_URL` always wins.

> Legacy aliases `Z_AI_API_KEY`, `Z_AI_BASE_URL`, `Z_AI_VISION_MODEL`,
> `Z_AI_MODE`, `ZAI_API_KEY` and `Z_AI_*` tunables are still accepted;
> `AI_*` takes precedence when both are set.

Size limits: local images ≤5MB, local videos ≤8MB (URLs are passed
through unchecked). `AI_VISION_MODEL_MAX_TOKENS` defaults to *omitted* —
the provider's own output cap applies; set it explicitly to cap output.
`AI_RETRY_COUNT` (default 1) controls API retries; only transient
failures (network, timeout, 5xx) are retried.

### Claude Code

```sh
# Z.AI
claude mcp add vision-mcp --env AI_API_KEY=your_key AI_MODE=ZAI -- npx -y github:nikkoxgonzales/vision-mcp

# Zhipu
claude mcp add vision-mcp --env AI_API_KEY=your_key AI_MODE=ZHIPU -- npx -y github:nikkoxgonzales/vision-mcp

# Any OpenAI-compatible provider
claude mcp add vision-mcp \
  --env AI_API_KEY=your_key \
  --env AI_BASE_URL=https://api.openai.com/v1/ \
  --env AI_VISION_MODEL=gpt-4o \
  -- npx -y github:nikkoxgonzales/vision-mcp
```

With a local clone, swap `npx -y github:nikkoxgonzales/vision-mcp`
for `node path/to/vision-mcp/build/index.js`.

### Other MCP clients — `.mcp.json`

Clients that read a project-level `.mcp.json` (VS Code, Cursor, Windsurf,
...): drop this at the project root.

```json
{
  "mcpServers": {
    "vision-mcp": {
      "command": "npx",
      "args": ["-y", "github:nikkoxgonzales/vision-mcp"],
      "env": {
        "AI_API_KEY": "your_api_key",
        "AI_MODE": "ZAI"
      }
    }
  }
}
```

For any other OpenAI-compatible provider, set the base URL and model
instead of `AI_MODE`:

```json
{
  "mcpServers": {
    "vision-mcp": {
      "command": "npx",
      "args": ["-y", "github:nikkoxgonzales/vision-mcp"],
      "env": {
        "AI_API_KEY": "your_api_key",
        "AI_BASE_URL": "https://api.openai.com/v1/",
        "AI_VISION_MODEL": "gpt-4o"
      }
    }
  }
}
```

With a local clone, swap `npx`/`args` for `command: "node"`,
`args: ["path/to/vision-mcp/build/index.js"]`.

Upstream platform docs:
[Z.AI Vision MCP](https://docs.z.ai/devpack/mcp/vision-mcp-server) ·
[Zhipu Vision MCP](https://docs.bigmodel.cn/cn/coding-plan/mcp/vision-mcp-server)

## Project layout

- `build/` — compiled server (vendored from `@z_ai/mcp-server` 0.1.4)
- `package.json` — package metadata; deps: `@modelcontextprotocol/sdk`, `zod`

## Changelog

- `2026-08-12` — hardening pass: API-key validation now matches real
  placeholders (real keys containing "api"/"key" no longer rejected);
  whitespace-only keys rejected; undocumented `ANTHROPIC_AUTH_TOKEN`
  fallback removed; `AI_MODE` matching case-insensitive; invalid numeric
  env values fall back to defaults; `max_tokens` omitted when unset;
  retries limited to transient failures and `AI_RETRY_COUNT` now wired;
  `analyze_video` restricted to ZAI/Zhipu (generic endpoints don't
  accept `video_url`); server identity `vision-mcp` v0.1.4.
- `2026-08-12` — v0.1.4 vendored; provider-agnostic config (`AI_BASE_URL` +
  `AI_VISION_MODEL` + `AI_API_KEY`, legacy `Z_AI_*` aliases accepted);
  explicit base URL wins over `AI_MODE`; provider-specific request params
  omitted for custom endpoints.

## Credits

- [Z.AI](https://z.ai/) — upstream `@z_ai/mcp-server` (Apache-2.0)
- Contributors: Chao Gong, Lei Yuan
