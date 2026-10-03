export type AiEngine = "gpt" | "gemini";
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type Resolution = "4k" | "2k" | "1080p";

export interface ProPresets {
  style: string;
  lighting: string;
  lens: string;
}

export interface AiStudioImageItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  enhancedPrompt?: string;
  engine: AiEngine;
  model: string;
  aspectRatio: AspectRatio;
  resolution: string;
  width: number;
  height: number;
  dpi: number;
  sizeKb: number;
  taskType: "create" | "edit" | "inpainting";
  tokens: number;
  costUsd: number;
  costVnd: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  engine?: AiEngine;
  model?: string;
  tokens?: number;
  costUsd?: number;
  costVnd?: number;
  timestamp: string;
}

export interface StudioStatus {
  hasGeminiKey: boolean;
  hasGptKey: boolean;
  geminiPreview?: string;
  gptPreview?: string;
  presets?: Record<string, Record<string, { name: string; prompt: string }>>;
  resolutions?: string[];
  aspectRatios?: string[];
}
