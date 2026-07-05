import http from 'node:http';

type AnalysisResult = {
  translation: string;
  authenticity_score: number;
  corporate_influencer_score: number;
  buzzwords_detected: string[];
  verdict: string;
  achievement_unlocked: string;
  linkedin_comment_you_will_probably_see: string;
};

const PORT = Number(process.env.PORT ?? 8799);

const buzzwords = [
  'thrilled',
  'honored',
  'humbled',
  'journey',
  'grateful',
  'leadership',
  'growth',
  'excited',
  'opportunity',
  'innovation',
  'synergy',
  'impact',
  'resilience',
  'community',
  'milestone',
  'learnings',
  'disrupt',
  'empower',
  'vision',
  'passion',
];

const achievements = [
  '🏆 Strategic Humility Master',
  '📢 Visibility Maximizer',
  '🚀 Thought Leader Apprentice',
  '🎤 Conference Selfie Collector',
  '💼 Corporate Storyteller',
  '📈 Engagement Pipeline Builder',
  '🤝 Networking Side Quest Complete',
];

const verdicts = [
  'Confidence wearing a humility costume.',
  'Career update disguised as a life lesson.',
  'Professional attention seeking executed successfully.',
  'A humblebrag with excellent stakeholder alignment.',
  'Personal brand maintenance with inspirational garnish.',
  'The algorithm has been politely summoned.',
];

const comments = [
  'Congratulations! Well deserved!',
  'Inspiring journey!',
  'Wishing you continued success!',
  'This is just the beginning!',
  'So proud to see this growth!',
  'Amazing milestone. Keep shining!',
];

function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy(new Error('Body too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response: http.ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function scoreText(text: string, detected: string[]) {
  const lower = text.toLowerCase();
  const lengthScore = Math.min(22, text.length / 34);
  const lineBreakScore = Math.min(12, (text.match(/\n/g)?.length ?? 0) * 2);
  const emojiScore = Math.min(12, (text.match(/[\u{1F300}-\u{1FAFF}]/gu)?.length ?? 0) * 3);
  const hashtagScore = Math.min(12, (text.match(/#/g)?.length ?? 0) * 4);
  const exclamationScore = Math.min(8, (text.match(/!/g)?.length ?? 0) * 2);
  const humbleScore = /(humbled|honored|grateful|blessed)/i.test(text) ? 18 : 0;
  const lessonScore = /(lesson|what.*taught|learned|takeaway|here'?s what)/i.test(text) ? 14 : 0;
  const promotionScore = /(promoted|new role|new position|joining|accepted|offer)/i.test(text) ? 12 : 0;
  const influencer = clampScore(
    18 +
      detected.length * 6 +
      lengthScore +
      lineBreakScore +
      emojiScore +
      hashtagScore +
      exclamationScore +
      humbleScore +
      lessonScore +
      promotionScore,
  );
  const authentic = clampScore(100 - influencer + (lower.includes('honest') ? 8 : 0) + (text.length < 240 ? 12 : 0));
  return { authentic, influencer };
}

function fallbackAnalysis(post: string, url?: string): AnalysisResult {
  const text = `${post} ${url ?? ''}`.trim();
  const detected = buzzwords
    .filter((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
    .slice(0, 10);
  const seed = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 7;
  const { authentic, influencer } = scoreText(text, detected);
  const lower = text.toLowerCase();

  let translation = 'I would like professional visibility, but with tasteful lighting.';
  if (/promoted|new role|new position/.test(lower)) {
    translation = 'I got promoted and would like maximum professional visibility.';
  } else if (/laid off|layoff|open to work/.test(lower)) {
    translation = 'Work got weird, so I am networking with dignity and a fresh banner.';
  } else if (/conference|summit|event/.test(lower)) {
    translation = 'I attended an event and successfully converted coffee into content.';
  } else if (/intern|internship/.test(lower)) {
    translation = 'I got an internship and my personal brand has entered its pilot season.';
  } else if (/founder|startup|building/.test(lower)) {
    translation = 'I am building something and would appreciate applause before revenue arrives.';
  } else if (/failure|rejected|mistake/.test(lower)) {
    translation = 'A normal setback has been upgraded into a leadership parable.';
  }

  return {
    translation,
    authenticity_score: authentic,
    corporate_influencer_score: influencer,
    buzzwords_detected: detected.length > 0 ? detected.map((word) => word[0].toUpperCase() + word.slice(1)) : ['Growth', 'Journey'],
    verdict: pick(verdicts, seed),
    achievement_unlocked: pick(achievements, seed + detected.length),
    linkedin_comment_you_will_probably_see: pick(comments, seed + text.length),
  };
}

function parseJsonObject(content: string): AnalysisResult {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model did not return JSON.');
  }
  const parsed = JSON.parse(match[0]) as AnalysisResult;
  return {
    translation: String(parsed.translation ?? ''),
    authenticity_score: clampScore(Number(parsed.authenticity_score ?? 50)),
    corporate_influencer_score: clampScore(Number(parsed.corporate_influencer_score ?? 50)),
    buzzwords_detected: Array.isArray(parsed.buzzwords_detected) ? parsed.buzzwords_detected.map(String).slice(0, 12) : [],
    verdict: String(parsed.verdict ?? ''),
    achievement_unlocked: String(parsed.achievement_unlocked ?? ''),
    linkedin_comment_you_will_probably_see: String(parsed.linkedin_comment_you_will_probably_see ?? ''),
  };
}

async function analyzeWithModel(post: string, url?: string): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    return fallbackAnalysis(post, url);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You analyze LinkedIn posts for a playful app called LinkedIn to English. Roast the post, not the author. Be witty and sarcastic, never mean. Never attack personal characteristics. Focus on LinkedIn culture and corporate buzzwords. Keep jokes workplace-safe. Keep responses concise. Return only valid JSON with keys: translation, authenticity_score, corporate_influencer_score, buzzwords_detected, verdict, achievement_unlocked, linkedin_comment_you_will_probably_see.',
        },
        {
          role: 'user',
          content: `LinkedIn post text:\n${post || '(none pasted)'}\n\nLinkedIn URL:\n${url || '(none provided)'}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('AI response was missing content.');
  }

  return parseJsonObject(content);
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST' || request.url !== '/api/analyze') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  try {
    const body = await readBody(request);
    const payload = JSON.parse(body || '{}') as { post?: string; url?: string };
    const post = String(payload.post ?? '').trim();
    const url = String(payload.url ?? '').trim();

    if (!post && !url) {
      sendJson(response, 400, { error: 'Paste a post or provide a LinkedIn URL.' });
      return;
    }

    const result = await analyzeWithModel(post, url);
    sendJson(response, 200, result);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'The translator tripped over a synergy deck. Try again.' });
  }
});

server.listen(PORT, () => {
  console.log(`LinkedIn -> English API running on http://localhost:${PORT}`);
});
