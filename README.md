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
| `analyze_video` | Video content analysis (URL or local file, ≤8MB) |

## Install

Requires Node.js 18+.

```sh
git clone https://github.com/nikkoxgonzales/vision-mcp.git
cd vision-mcp
npm install --ignore-scripts   # deps only; build output is vendored
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

### Claude Code

```sh
# Z.AI
claude mcp add vision-mcp --env AI_API_KEY=your_key AI_MODE=ZAI -- node path/to/vision-mcp/build/index.js

# Zhipu
claude mcp add vision-mcp --env AI_API_KEY=your_key AI_MODE=ZHIPU -- node path/to/vision-mcp/build/index.js

# Any OpenAI-compatible provider
claude mcp add vision-mcp \
  --env AI_API_KEY=your_key \
  --env AI_BASE_URL=https://api.openai.com/v1/ \
  --env AI_VISION_MODEL=gpt-4o \
  -- node path/to/vision-mcp/build/index.js
```

### Other MCP clients

Use the same env vars with any client that supports stdio MCP servers:
run `node build/index.js` as the command. Upstream platform docs:
[Z.AI Vision MCP](https://docs.z.ai/devpack/mcp/vision-mcp-server) ·
[Zhipu Vision MCP](https://docs.bigmodel.cn/cn/coding-plan/mcp/vision-mcp-server)

## Project layout

- `build/` — compiled server (vendored from `@z_ai/mcp-server` 0.1.4)
- `package.json` — package metadata; deps: `@modelcontextprotocol/sdk`, `zod`

## Changelog

- `2026-08-12` — v0.1.4 vendored; provider-agnostic config (`AI_BASE_URL` +
  `AI_VISION_MODEL` + `AI_API_KEY`, legacy `Z_AI_*` aliases accepted);
  explicit base URL wins over `AI_MODE`; provider-specific request params
  omitted for custom endpoints.

## Credits

- [Z.AI](https://z.ai/) — upstream `@z_ai/mcp-server` (Apache-2.0)
- Contributors: Chao Gong, Lei Yuan
