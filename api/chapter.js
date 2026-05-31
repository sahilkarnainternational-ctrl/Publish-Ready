import { cleanApiKey } from './_utils.js';

function classProfile(classLevel = 'Grade 10') {
  const grade = parseInt(String(classLevel).replace(/\D/g, ''), 10) || 10;
  if (grade <= 5) {
    return {
      depth: 'elementary',
      words: '600-900',
      math: 'avoid heavy formulas; use simple examples and analogies',
      sections: 'introduction, fun facts, simple explanation, one real-life example, summary',
    };
  }
  if (grade <= 8) {
    return {
      depth: 'middle',
      words: '1200-1700',
      math: 'include basic formulas with step-by-step examples',
      sections: 'introduction, context, core explanation, worked example, summary, conclusion',
    };
  }
  if (grade <= 10) {
    return {
      depth: 'high',
      words: '1800-2400',
      math: 'include formulas, derivations where useful, exam-style examples',
      sections: 'introduction, context, detailed explanation, formulas, worked examples, applications, summary, conclusion',
    };
  }
  return {
    depth: 'advanced',
    words: '1800-2600',
    math: 'full formulas, derivations, and rigorous examples',
    sections: 'introduction, prerequisites, theory, derivations, formulas, examples, applications, summary, conclusion',
  };
}

const CURRICULUM_GUIDANCE = {
  Nepal: 'Nepal Education Board (NEB) / CDC Nepal curriculum. Align to Nepali secondary science and mathematics standards with examples from local textbooks and exam-style practice.',
  India: 'CBSE/NCERT curriculum. Align to NCERT textbook style, include CBSE examination examples and clear step-by-step solutions.',
  USA: 'US Common Core and standard high school STEM framework. Align to Common Core learning goals and AP-level clarity when relevant.',
  UK: 'UK National Curriculum, GCSE/A-level style. Reference AQA, Edexcel, or OCR exam conventions and provide crisp conceptual clarity.',
  Australia: 'Australian Curriculum (ACARA). Align to ACARA outcomes with Australian examples and strong scientific reasoning.',
  Canada: 'Canadian provincial high school curriculum. Focus on strong conceptual mastery, practical examples, and exam-ready guidance.',
  International: 'A rigorous international curriculum standard. Use clear global examples and strong conceptual scaffolding for a worldwide audience.',
};

async function fetchWikiText(topic) {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    const hit = searchData.query?.search?.[0];
    if (!hit) return { title: topic, extract: '' };

    const detailRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&pageids=${hit.pageid}&exintro=0&explaintext=1&exchars=8000&origin=*`
    );
    const detailData = await detailRes.json();
    const page = detailData.query?.pages?.[hit.pageid];
    return { title: page?.title || topic, extract: page?.extract || '' };
  } catch {
    return { title: topic, extract: '' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { topic, subject = 'Science', classLevel = 'Grade 10', age, curriculum = 'International', country = '' } = req.body;
    if (!topic?.trim()) {
      res.status(400).json({ error: 'topic is required' });
      return;
    }

    const apiKey = cleanApiKey(process.env.GROQ_API_KEY);
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY not configured' });
      return;
    }

    const wiki = await fetchWikiText(topic.trim());
    const profile = classProfile(classLevel);
    const targetCurriculum = curriculum || country || 'International';
    const curriculumInstructions = CURRICULUM_GUIDANCE[targetCurriculum] || CURRICULUM_GUIDANCE.International;

    const systemPrompt = `You are an expert ${subject} textbook author writing for ${classLevel}${age ? ` (age ${age})` : ''}.
Create a complete structured textbook chapter in Markdown. Depth: ${profile.depth}. Target length: ${profile.words} words.
Include where appropriate: ${profile.sections}. Math: ${profile.math}.
Use at least two curriculum-aligned visual aids, include a mermaid flowchart code block if the topic benefits from a diagram, and add exam-ready examples and application notes.
Use ## headings for each major section.
Align the chapter to the following curriculum guidance: ${curriculumInstructions}
Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "introduction": "markdown string",
  "context": "markdown string",
  "explanation": "markdown string (main body with ## subsections)",
  "formulas": "markdown string with LaTeX $...$ or empty string",
  "examples": "markdown string",
  "diagramMermaid": "mermaid flowchart code without fences or empty string",
  "summary": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "conclusion": "markdown string",
  "relatedTopics": ["topic1", "topic2", "topic3"]
}`;

    const userPrompt = `Topic: "${topic.trim()}"
Subject: ${subject}
Class: ${classLevel}
Curriculum: ${targetCurriculum}
Country: ${country || 'Global'}
Wikipedia reference (use as factual base, rewrite for the student's level):
Title: ${wiki.title}
${wiki.extract.slice(0, 6000)}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      console.error('Chapter generation failed:', groqRes.status);
      res.status(500).json({ error: 'Chapter generation failed' });
      return;
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let chapter;
    try {
      chapter = JSON.parse(raw);
    } catch {
      chapter = {
        title: wiki.title,
        introduction: wiki.extract.slice(0, 800),
        context: '',
        explanation: wiki.extract.slice(800, 3000) || wiki.extract,
        formulas: '',
        examples: '',
        diagramMermaid: '',
        summary: ['Review the core concepts', 'Practice with related quizzes', 'Explore linked topics'],
        conclusion: 'Keep exploring this topic with videos and quizzes in Axyomis-X.',
        relatedTopics: [],
      };
    }

    res.status(200).json({
      ...chapter,
      title: chapter.title || wiki.title,
      subject,
      classLevel,
      topic: topic.trim(),
      curriculum: targetCurriculum,
      country,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title.replace(/ /g, '_'))}`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chapter API error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
