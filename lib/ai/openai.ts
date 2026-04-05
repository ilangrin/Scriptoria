import OpenAI from 'openai';
import type { AIPageResult, UncertainTerm, TargetLanguage, TranslationStyle, UserCorrection } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';

const LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  hebrew: 'Hebrew (עברית)',
  english: 'English',
  french: 'Clean modern French (rewrite of the original)',
};

const STYLE_DESCRIPTIONS: Record<TranslationStyle, string> = {
  accurate: 'Accurate and faithful — translate as closely as possible to the original meaning and structure',
  fluent: 'Fluent and natural — translate with a natural writing style suited to the target language',
};

function buildSystemPrompt(): string {
  return `You are an expert paleographer and translator specializing in old French documents, including handwritten manuscripts and printed historical texts from the 17th to 19th centuries.

Your task is to:
1. Transcribe the exact French text from the document image (preserve original spelling, abbreviations, and punctuation)
2. Translate the text into the specified target language
3. Identify any unclear, ambiguous, or uncertain parts of the text
4. Return a STRICTLY VALID JSON object — no markdown, no extra text, only the JSON

CRITICAL RULES:
- Never silently guess unclear handwriting
- Always flag uncertainty explicitly
- Be conservative: when in doubt, mark it as uncertain
- Preserve historical context and terminology
- For multi-page PDFs, process only the specified page number`;
}

function buildUserPrompt(
  targetLanguage: TargetLanguage,
  style: TranslationStyle,
  pageNumber: number,
  totalPages: number,
  corrections?: UserCorrection[]
): string {
  let prompt = `Process page ${pageNumber} of ${totalPages} of this old French document.

Target language: ${LANGUAGE_NAMES[targetLanguage]}
Translation style: ${STYLE_DESCRIPTIONS[style]}`;

  if (corrections && corrections.length > 0) {
    prompt += `\n\nUser corrections for unclear terms:\n`;
    corrections.forEach((c) => {
      prompt += `- Term "${c.originalSnippet}": User says it reads "${c.correction}"\n`;
    });
    prompt += `\nApply these corrections and regenerate the transcription and translation.`;
  }

  prompt += `

Return ONLY a valid JSON object in this exact format:
{
  "transcription": "exact French text from the document",
  "translation": "translated text in the target language",
  "confidence": "high | medium | low",
  "uncertain_terms": [
    {
      "id": "term_1",
      "snippet": "the unclear word or phrase",
      "context": "the full sentence containing the unclear part",
      "reason": "why this part is unclear (e.g., illegible handwriting, faded ink, archaic abbreviation)",
      "suggested_guess": "your best guess if you have one (optional)",
      "question": "a short, clear question to ask the user for clarification"
    }
  ]
}

Rules:
- uncertain_terms should be an empty array [] if text is fully clear
- confidence should reflect the overall quality of the transcription
- Each uncertain term must have a unique id (term_1, term_2, etc.)
- Do NOT include markdown code blocks — return raw JSON only`;

  return prompt;
}

export interface ProcessPageOptions {
  imageBuffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  pageNumber: number;
  totalPages: number;
  targetLanguage: TargetLanguage;
  style: TranslationStyle;
  corrections?: UserCorrection[];
}

export interface ProcessPageResult {
  result: AIPageResult;
  rawRequest: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
}

export async function processPage(options: ProcessPageOptions): Promise<ProcessPageResult> {
  const {
    imageBuffer,
    mimeType,
    pageNumber,
    totalPages,
    targetLanguage,
    style,
    corrections,
  } = options;

  const base64Data = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const userPrompt = buildUserPrompt(targetLanguage, style, pageNumber, totalPages, corrections);

  // Build content parts based on file type
  const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [];

  if (mimeType === 'application/pdf') {
    // GPT-4o supports PDF files natively
    contentParts.push({
      type: 'text',
      text: `[PDF Document - Page ${pageNumber} of ${totalPages}]\n\n${userPrompt}`,
    } as OpenAI.Chat.ChatCompletionContentPartText);
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: dataUrl,
        detail: 'high',
      },
    } as OpenAI.Chat.ChatCompletionContentPartImage);
  } else {
    contentParts.push({
      type: 'text',
      text: userPrompt,
    } as OpenAI.Chat.ChatCompletionContentPartText);
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: dataUrl,
        detail: 'high',
      },
    } as OpenAI.Chat.ChatCompletionContentPartImage);
  }

  const requestPayload = {
    model: MODEL,
    messages: [
      {
        role: 'system' as const,
        content: buildSystemPrompt(),
      },
      {
        role: 'user' as const,
        content: contentParts,
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
    response_format: { type: 'json_object' as const },
  };

  const sanitizedRequest = {
    model: requestPayload.model,
    messages: requestPayload.messages.map((m) => ({
      role: m.role,
      content: typeof m.content === 'string'
        ? m.content
        : (m.content as OpenAI.Chat.ChatCompletionContentPart[]).map((p) => {
            if (p.type === 'text') return { type: 'text', text: p.text };
            if (p.type === 'image_url') return { type: 'image_url', url: '[BASE64_IMAGE_REDACTED]' };
            return p;
          }),
    })),
    max_tokens: requestPayload.max_tokens,
    temperature: requestPayload.temperature,
  };

  const response = await openai.chat.completions.create(requestPayload);

  const rawResponse = {
    id: response.id,
    model: response.model,
    usage: response.usage,
    finish_reason: response.choices[0]?.finish_reason,
    content_length: response.choices[0]?.message?.content?.length ?? 0,
  };

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  let parsed: AIPageResult;
  try {
    parsed = JSON.parse(content) as AIPageResult;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content.slice(0, 200)}`);
  }

  // Validate required fields
  if (!parsed.transcription || !parsed.translation) {
    throw new Error('AI response missing required fields (transcription or translation)');
  }

  // Ensure uncertain_terms is always an array
  if (!Array.isArray(parsed.uncertain_terms)) {
    parsed.uncertain_terms = [];
  }

  // Validate and normalize uncertain terms
  parsed.uncertain_terms = parsed.uncertain_terms.map((term: UncertainTerm, idx: number) => ({
    id: term.id ?? `term_${idx + 1}`,
    snippet: term.snippet ?? '',
    context: term.context ?? '',
    reason: term.reason ?? '',
    suggested_guess: term.suggested_guess,
    question: term.question ?? 'Can you clarify this term?',
  }));

  return {
    result: parsed,
    rawRequest: sanitizedRequest,
    rawResponse,
  };
}

export async function reprocessWithCorrections(
  options: ProcessPageOptions
): Promise<ProcessPageResult> {
  return processPage(options);
}
