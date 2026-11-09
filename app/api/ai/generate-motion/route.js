import { GoogleGenAI } from "@google/genai";
import {
  MOTIONLAB_SYSTEM_INSTRUCTION,
  buildMotionGenerationPrompt,
} from "@/engine/ai/promptEngine";
import { validateMotionResponse } from "@/engine/ai/schema";
import {
  getPrioritizedKeyPool,
  getModelCandidateList,
  isRetryableApiKeyError,
  cleanErrorMessage,
} from "@/engine/ai/keyManager";

// Ensure Node.js runtime for secret preservation and API calling
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handles POST requests to generate structured motion graphics compositions
 * using Google Gemini via the official @google/genai SDK.
 * Supports:
 * - Multi-key pool with round-robin rotation
 * - Model cascade fallback when high demand (503) or rate limit (429) occurs
 * - Clean user-facing error messaging
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      prompt,
      duration = 15,
      aspectRatio = "16:9",
      fps = 60,
      visualStyle = "modern_corporate",
      language = "en",
      sceneCount = "auto",
      action = "generate_full", // 'generate_full' | 'regenerate_scene'
      sceneToRegenerate = null,
    } = body;

    // 1. Validate Input
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return Response.json(
        {
          success: false,
          error: "Prompt is required and must be at least 3 characters long.",
          code: "INVALID_PROMPT",
        },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return Response.json(
        {
          success: false,
          error: "Prompt exceeds maximum allowed length of 2000 characters.",
          code: "PROMPT_TOO_LONG",
        },
        { status: 400 }
      );
    }

    // 2. Check Gemini API Key Pool (Supports comma-separated multi-keys)
    const keyPool = getPrioritizedKeyPool();
    if (keyPool.length === 0) {
      return Response.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY to .env.local or environment settings.",
          code: "GEMINI_NOT_CONFIGURED",
          help: "Get your API key at https://aistudio.google.com/ and set GEMINI_API_KEY in .env.local (supports comma-separated multi-key: GEMINI_API_KEY=key1,key2,key3).",
        },
        { status: 503 }
      );
    }

    const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const modelCandidates = getModelCandidateList(preferredModel);

    // 3. Construct Prompt Text
    let userPromptText = "";
    if (action === "regenerate_scene" && sceneToRegenerate) {
      userPromptText = `You are regenerating only ONE specific scene for an existing motion graphics project.
Original Project Context: "${prompt}"
Target Scene to Replace: Scene ID "${sceneToRegenerate.id}", Name: "${sceneToRegenerate.name}", Duration: ${sceneToRegenerate.duration}s.
Visual Style: ${visualStyle}. Text Language: ${language}.
Canvas Aspect Ratio: ${aspectRatio}.

Generate a fresh, creative replacement for this scene with high-impact visuals, polished typography, and smooth keyframe animations.
Return a full JSON object where "scenes" contains ONLY this regenerated scene with matching duration.`;
    } else {
      userPromptText = buildMotionGenerationPrompt({
        userPrompt: prompt,
        duration: Math.min(60, Math.max(3, Number(duration) || 15)),
        aspectRatio,
        fps: Math.min(60, Math.max(24, Number(fps) || 60)),
        visualStyle,
        language,
        sceneCount,
      });
    }

    // 4. Multi-Key & Model Cascade Fallback Execution
    let response = null;
    let successfulKeyInfo = null;
    let successfulModel = null;
    let lastError = null;

    // Outer loop: Try models (e.g. 2.5-flash -> 2.0-flash -> 1.5-flash) if model 503 overloaded
    outerModelLoop: for (const modelToTry of modelCandidates) {
      // Inner loop: Try each API key in the pool
      for (const keyItem of keyPool) {
        try {
          const ai = new GoogleGenAI({ apiKey: keyItem.key });
          response = await ai.models.generateContent({
            model: modelToTry,
            contents: userPromptText,
            config: {
              systemInstruction: MOTIONLAB_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            successfulKeyInfo = keyItem;
            successfulModel = modelToTry;
            break outerModelLoop; // Success! Break out completely
          }
        } catch (err) {
          lastError = err;
          console.warn(
            `[Gemini Execution] Model "${modelToTry}" with Key #${keyItem.index}/${keyItem.total} failed:`,
            err.message
          );

          // If retryable (503 overloaded, 429 quota, 401/403 auth), try next key or fallback model
          if (isRetryableApiKeyError(err)) {
            continue;
          }

          // If non-retryable (e.g. prompt syntax violation), break early
          break outerModelLoop;
        }
      }
    }

    if (!response || !response.text) {
      const rawErrMsg = lastError?.message || "All Gemini API keys and models in pool failed or returned empty.";
      const cleanMsg = cleanErrorMessage(rawErrMsg);
      const isOverloaded = rawErrMsg.includes("503") || rawErrMsg.toLowerCase().includes("high demand");
      const isQuota = rawErrMsg.toLowerCase().includes("quota") || rawErrMsg.includes("429");
      const isAuth = rawErrMsg.toLowerCase().includes("api key") || rawErrMsg.includes("403") || rawErrMsg.includes("401");

      return Response.json(
        {
          success: false,
          error: cleanMsg,
          code: isOverloaded ? "MODEL_HIGH_DEMAND" : isQuota ? "RATE_LIMITED" : isAuth ? "AUTH_FAILED" : "SERVER_ERROR",
          keyPoolCount: keyPool.length,
          modelsAttempted: modelCandidates,
        },
        { status: isOverloaded ? 503 : isQuota ? 429 : isAuth ? 401 : 500 }
      );
    }

    const responseText = response.text;

    // 5. Parse and Validate Structured JSON
    let parsedJson;
    try {
      const cleanJson = responseText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsedJson = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("[Gemini API] Failed to parse JSON response:", parseErr, responseText);
      return Response.json(
        {
          success: false,
          error: "Gemini output could not be parsed into valid JSON.",
          code: "JSON_PARSE_ERROR",
          raw: responseText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const { isValid, data: sanitizedData, warnings } = validateMotionResponse(parsedJson);

    return Response.json({
      success: true,
      storyboard: sanitizedData,
      warnings,
      meta: {
        model: successfulModel,
        aspectRatio,
        fps,
        action,
        keyIndex: successfulKeyInfo?.index,
        totalKeysConfigured: keyPool.length,
      },
    });
  } catch (error) {
    console.error("[Gemini API Route Fatal Error]:", error);
    return Response.json(
      {
        success: false,
        error: cleanErrorMessage(error.message),
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
