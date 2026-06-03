/**
 * Open Router AI Service
 * Provides access to free and premium AI models
 * Used for class-adaptive content and enhanced learning
 */

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: 'assistant';
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

import type { ClassLevel } from '../context/UserContext';

export type AIModel = 'free' | 'standard' | 'advanced';

// Model mapping for different use cases
const MODEL_MAP: Record<AIModel, string> = {
  free: 'meta-llama/llama-2-70b-chat', // Free fast model
  standard: 'mistralai/mistral-7b-instruct', // Standard quality
  advanced: 'meta-llama/llama-2-70b-chat', // Advanced reasoning
};

// System prompts adapted by class level
function getSystemPrompt(classLevel: ClassLevel, context: string = ''): string {
  const basePrompt = `You are an expert educational AI tutor named ASTRA. Your role is to help students learn effectively.
Key responsibilities:
- Adapt explanations to the student's class level
- Use relatable examples and analogies
- Encourage critical thinking
- Break down complex topics into digestible parts
- Provide step-by-step solutions when needed
- Use proper scientific terminology but explain unfamiliar terms
${context ? `\nContext: ${context}` : ''}`;

  const adaptations: Partial<Record<ClassLevel, string>> = {
    'Grade 5': `${basePrompt}\n\nClass Level Adaptation (Grade 5):\n- Use simple, everyday language\n- Focus on basic concepts\n- Use concrete examples from daily life\n- Keep explanations short and clear\n- Use visual descriptions and analogies from familiar objects`,
    
    'Grade 8': `${basePrompt}\n\nClass Level Adaptation (Grade 8):\n- Use intermediate terminology\n- Introduce foundational principles\n- Connect topics to real-world applications\n- Explain cause-and-effect relationships\n- Include diagrams description where helpful`,
    
    'Grade 10': `${basePrompt}\n\nClass Level Adaptation (Grade 10):\n- Use proper scientific terminology\n- Explain mechanisms and processes in detail\n- Include mathematical relationships when relevant\n- Discuss historical context and scientific method\n- Connect to curriculum standards`,
    
    'Grade 12': `${basePrompt}\n\nClass Level Adaptation (Grade 12):\n- Use advanced scientific terminology\n- Include mathematical derivations and formulas\n- Discuss advanced theories and concepts\n- Compare different approaches and perspectives\n- Include board exam level depth`,
    
    'Undergraduate': `${basePrompt}\n\nClass Level Adaptation (Undergraduate):\n- Use specialized terminology\n- Include mathematical proofs and derivations\n- Discuss research and advanced applications\n- Include peer-reviewed concepts\n- Prepare for competitive exams and higher education`,
  };

  return adaptations[classLevel] || basePrompt;
}

/**
 * Send a request to Open Router API
 */
export async function askOpenRouter(
  messages: AIMessage[],
  classLevel: ClassLevel = 'Grade 10',
  model: AIModel = 'free',
  options?: {
    temperature?: number;
    max_tokens?: number;
    context?: string;
  }
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('Open Router API key not configured. Set VITE_OPEN_ROUTER_API_KEY in environment.');
  }

  const systemPrompt = getSystemPrompt(classLevel, options?.context);

  try {
    const response = await fetch('https://openrouter.io/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Axyomis Educational Platform',
      },
      body: JSON.stringify({
        model: MODEL_MAP[model],
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2048,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Open Router API error: ${error.error?.message || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from Open Router API');
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Open Router API error:', error);
    throw error;
  }
}

/**
 * Generate class-adapted explanation for a topic
 */
export async function generateClassAdaptedExplanation(
  topic: string,
  classLevel: ClassLevel,
  additionalContext?: string
): Promise<string> {
  const prompt: AIMessage = {
    role: 'user',
    content: `Explain "${topic}" in a way that is appropriate for ${classLevel} students.${additionalContext ? ` Additional context: ${additionalContext}` : ''}`,
  };

  return askOpenRouter([prompt], classLevel, 'standard', { context: `Topic: ${topic}` });
}

/**
 * Generate questions appropriate for a class level
 */
export async function generateClassAdaptedQuestions(
  topic: string,
  classLevel: ClassLevel,
  count: number = 5
): Promise<string[]> {
  const prompt: AIMessage = {
    role: 'user',
    content: `Generate ${count} well-crafted educational questions about "${topic}" suitable for ${classLevel} students. Format as a numbered list.`,
  };

  const response = await askOpenRouter([prompt], classLevel, 'standard');
  
  // Parse the response to extract questions
  const questions = response
    .split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, count);

  return questions;
}

/**
 * Check if a response is appropriate for a class level
 */
export async function validateClassLevelContent(
  content: string,
  classLevel: ClassLevel
): Promise<{ isAppropriate: boolean; reason: string }> {
  const prompt: AIMessage = {
    role: 'user',
    content: `Is this content appropriate for ${classLevel} students? Content: "${content}"\n\nRespond with "YES" or "NO" followed by a brief reason.`,
  };

  const response = await askOpenRouter([prompt], classLevel, 'free', { max_tokens: 100 });
  const isAppropriate = response.toUpperCase().startsWith('YES');
  
  return {
    isAppropriate,
    reason: response.replace(/^(YES|NO)\s*-?\s*/i, '').trim(),
  };
}

/**
 * Adapt content difficulty to a different class level
 */
export async function adaptContentToDifficulty(
  content: string,
  fromLevel: ClassLevel,
  toLevel: ClassLevel
): Promise<string> {
  const prompt: AIMessage = {
    role: 'user',
    content: `Take this content written for ${fromLevel} students and adapt it for ${toLevel} students:\n\n"${content}"\n\nProvide only the adapted content without explanation.`,
  };

  return askOpenRouter([prompt], toLevel, 'standard');
}

/**
 * Generate learning paths for a topic
 */
export async function generateLearningPath(
  topic: string,
  classLevel: ClassLevel
): Promise<string[]> {
  const prompt: AIMessage = {
    role: 'user',
    content: `Create a structured learning path for "${topic}" at ${classLevel} level. Break it down into 5-8 progressive steps, from basics to advanced. Format as a numbered list.`,
  };

  const response = await askOpenRouter([prompt], classLevel, 'standard');
  
  const steps = response
    .split('\n')
    .filter(line => line.trim().match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  return steps;
}
