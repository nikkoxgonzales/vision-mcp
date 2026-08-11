import { ApiError } from '../types/index.js';
/**
 * Parse an int from an env string; NaN/invalid falls back to the default so
 * a mistyped var can't produce an instant-abort timeout or null in the request.
 */
function parseIntSafe(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}
function parseFloatSafe(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
}
/**
 * Environment configuration service using singleton pattern
 */
export class EnvironmentService {
    static instance;
    config = null;
    constructor() { }
    /**
     * Get singleton instance of EnvironmentService
     */
    static getInstance() {
        if (!EnvironmentService.instance) {
            EnvironmentService.instance = new EnvironmentService();
        }
        return EnvironmentService.instance;
    }
    /**
     * Get environment configuration
     */
    getConfig() {
        if (!this.config) {
            this.config = this.loadEnvironmentConfig();
        }
        return this.config;
    }
    /**
     * Load environment configuration from process.env
     */
    loadEnvironmentConfig() {
        const envConfig = { ...process.env };
        // Platform-agnostic env names (AI_*) are canonical; Z_AI_* and ZAI_*
        // are accepted as backward-compatible aliases. AI_* wins when both set.
        for (const [canonical, legacy] of [
            ['AI_API_KEY', 'Z_AI_API_KEY'],
            ['AI_BASE_URL', 'Z_AI_BASE_URL'],
            ['AI_VISION_MODEL', 'Z_AI_VISION_MODEL'],
            ['AI_VISION_MODEL_TEMPERATURE', 'Z_AI_VISION_MODEL_TEMPERATURE'],
            ['AI_VISION_MODEL_TOP_P', 'Z_AI_VISION_MODEL_TOP_P'],
            ['AI_VISION_MODEL_MAX_TOKENS', 'Z_AI_VISION_MODEL_MAX_TOKENS'],
            ['AI_TIMEOUT', 'Z_AI_TIMEOUT'],
            ['AI_RETRY_COUNT', 'Z_AI_RETRY_COUNT']
        ]) {
            if (envConfig[canonical] != null) {
                envConfig[legacy] = envConfig[canonical];
            }
        }
        const hasExplicitBaseUrl = envConfig.Z_AI_BASE_URL != null
            && envConfig.Z_AI_BASE_URL.trim().length > 0;
        // An explicit Z_AI_BASE_URL wins over mode presets — this is what makes
        // the server work with any OpenAI-compatible provider (OpenAI, Groq,
        // OpenRouter, local vLLM/Ollama, ...). Modes only fill in the default.
        if (hasExplicitBaseUrl) {
            envConfig.PLATFORM_MODE = 'CUSTOM';
        }
        else {
            // Support PLATFORM_MODE, AI_MODE and Z_AI_MODE for backward compatibility.
            // First VALID mode wins (case-insensitive); junk values fall through
            // to the next candidate instead of silently shadowing a valid one.
            const MODE_TO_PLATFORM = {
                'Z_AI': 'ZAI', 'ZAI': 'ZAI', 'Z': 'ZAI',
                'ZHIPU_AI': 'ZHIPU', 'ZHIPUAI': 'ZHIPU',
                'ZHIPU': 'ZHIPU', 'BIGMODEL': 'ZHIPU'
            };
            let platformMode = null;
            for (const candidate of [envConfig.PLATFORM_MODE, envConfig.AI_MODE, envConfig.Z_AI_MODE]) {
                if (!candidate) {
                    continue;
                }
                const normalized = MODE_TO_PLATFORM[candidate.trim().toUpperCase()];
                if (normalized) {
                    platformMode = normalized;
                    break;
                }
            }
            envConfig.PLATFORM_MODE = platformMode || 'ZHIPU';
            envConfig.Z_AI_BASE_URL = platformMode === 'ZAI'
                // for z.ai paas
                ? 'https://api.z.ai/api/paas/v4/'
                // for zhipuai paas
                : 'https://open.bigmodel.cn/api/paas/v4/';
        }
        if (!envConfig.Z_AI_API_KEY && envConfig.ZAI_API_KEY) {
            envConfig.Z_AI_API_KEY = envConfig.ZAI_API_KEY;
            console.warn("[important] Z_AI_API_KEY is not set but found ZAI_API_KEY, using ZAI_API_KEY as Z_AI_API_KEY");
        }
        // Reject missing, whitespace-only, and unfilled placeholder keys. Match
        // against known placeholder strings only — a substring scan rejects real
        // keys that happen to contain 'api' or 'key' (e.g. sk-ant-api03-...).
        const apiKey = (envConfig.Z_AI_API_KEY || '').trim();
        const PLACEHOLDER_API_KEYS = new Set([
            'your_api_key', 'your_zhipu_api_key', 'your_zai_api_key',
            'your_zai_key', '<api_key>', '<your_api_key>', 'xxx', 'sk-xxx'
        ]);
        if (!apiKey || PLACEHOLDER_API_KEYS.has(apiKey.toLowerCase())) {
            throw new ApiError('AI_API_KEY environment variable is required, please set your actual API key');
        }
        envConfig.Z_AI_API_KEY = apiKey;
        return {
            Z_AI_BASE_URL: envConfig.Z_AI_BASE_URL,
            Z_AI_API_KEY: envConfig.Z_AI_API_KEY,
            Z_AI_VISION_MODEL: envConfig.Z_AI_VISION_MODEL,
            Z_AI_VISION_MODEL_TEMPERATURE: envConfig.Z_AI_VISION_MODEL_TEMPERATURE,
            Z_AI_VISION_MODEL_TOP_P: envConfig.Z_AI_VISION_MODEL_TOP_P,
            Z_AI_VISION_MODEL_MAX_TOKENS: envConfig.Z_AI_VISION_MODEL_MAX_TOKENS,
            Z_AI_TIMEOUT: envConfig.Z_AI_TIMEOUT,
            Z_AI_RETRY_COUNT: envConfig.Z_AI_RETRY_COUNT,
            SERVER_NAME: envConfig.SERVER_NAME,
            SERVER_VERSION: envConfig.SERVER_VERSION,
            PLATFORM_MODE: envConfig.PLATFORM_MODE
        };
    }
    /**
     * Get server configuration
     */
    getServerConfig() {
        const config = this.getConfig();
        return {
            name: config.SERVER_NAME || 'vision-mcp',
            version: config.SERVER_VERSION || '0.1.4'
        };
    }
    /**
     * Get platform mode
     */
    getPlatformMode() {
        const config = this.getConfig();
        return config.PLATFORM_MODE || 'ZHIPU';
    }
    /**
     * Get API configuration
     */
    getVisionConfig() {
        const config = this.getConfig();
        const maxTokensRaw = config.Z_AI_VISION_MODEL_MAX_TOKENS;
        return {
            model: config.Z_AI_VISION_MODEL || 'glm-4.6v',
            timeout: parseIntSafe(config.Z_AI_TIMEOUT, 300000),
            retryCount: Math.max(0, parseIntSafe(config.Z_AI_RETRY_COUNT, 1)),
            url: config.Z_AI_BASE_URL.replace(/\/+$/, '') + '/chat/completions',
            temperature: parseFloatSafe(config.Z_AI_VISION_MODEL_TEMPERATURE, 0.8),
            topP: parseFloatSafe(config.Z_AI_VISION_MODEL_TOP_P, 0.6),
            // null when unset -> request omits max_tokens so each provider's
            // own output limit applies (a fixed 32768 breaks providers that
            // cap lower, e.g. OpenAI's 16384).
            maxTokens: maxTokensRaw != null && maxTokensRaw.trim() !== ''
                ? parseIntSafe(maxTokensRaw, 32768)
                : null
        };
    }
    /**
     * Get ZAI API key from configuration
     */
    getApiKey() {
        return this.getConfig().Z_AI_API_KEY;
    }
}
/**
 * Global environment service instance
 */
export const environmentService = EnvironmentService.getInstance();
/**
 * Configuration service instance (for backward compatibility)
 */
export const configurationService = environmentService;
