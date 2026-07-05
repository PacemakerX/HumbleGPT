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
  '🏆 Humility LARP Champion',
  '📢 Engagement Bait Specialist',
  '🚀 Thought Leader Cosplay, Tier 1',
  '🎤 Conference Selfie Hoarder',
  '💼 Personal Brand Mercenary',
  '📈 Buzzword Supply Chain Manager',
  '🤝 LinkedIn Clout Farmer',
  '🔥 Roasted On Sight',
];

const verdicts = [
  'Confidence cosplaying as humility, and everyone can see the seams.',
  'A career update wearing a hollow life-lesson trench coat.',
  'Professional attention-seeking, executed with zero self-awareness.',
  'A humblebrag with a full stakeholder-alignment deck behind it.',
  'Personal brand maintenance dressed up as inspiration. Nobody is fooled.',
  'The algorithm has been summoned, and even it is embarrassed.',
  'This post has main character syndrome and a captive audience.',
  'Vulnerability, but only the marketable kind.',
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

function fallbackAnalysis(post: string, url?: string, fetchedContent?: string): AnalysisResult {
  const text = `${post} ${fetchedContent ?? ''}`.trim() || (url ?? '').trim();
  const detected = buzzwords
    .filter((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
    .slice(0, 10);
  const seed = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 7;
  const { authentic, influencer } = scoreText(text, detected);
  const lower = text.toLowerCase();

  let translation = 'I crave professional validation and have lit it dramatically for maximum reach.';
  if (/promoted|new role|new position/.test(lower)) {
    translation = 'I got a slightly better title and would like a standing ovation from strangers.';
  } else if (/laid off|layoff|open to work/.test(lower)) {
    translation = 'I got fired, so I am rebranding the trauma as an inspiring pivot with a fresh banner photo.';
  } else if (/conference|summit|event/.test(lower)) {
    translation = 'I stood near famous people, ate a stale croissant, and am now a thought leader on the subject.';
  } else if (/intern|internship/.test(lower)) {
    translation = 'I fetched coffee for a summer and am treating it like a Nobel Prize acceptance speech.';
  } else if (/founder|startup|building/.test(lower)) {
    translation = 'I have no revenue and a Canva pitch deck, but I would like applause as if I already won.';
  } else if (/failure|rejected|mistake/.test(lower)) {
    translation = 'Something ordinary went wrong and I have laundered it into a leadership TED talk.';
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

function parseScore(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  const match = String(value ?? '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 50;
}

function parseJsonObject(content: string): AnalysisResult {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model did not return JSON.');
  }
  const parsed = JSON.parse(match[0]) as AnalysisResult;
  return {
    translation: String(parsed.translation ?? ''),
    authenticity_score: clampScore(parseScore(parsed.authenticity_score)),
    corporate_influencer_score: clampScore(parseScore(parsed.corporate_influencer_score)),
    buzzwords_detected: Array.isArray(parsed.buzzwords_detected) ? parsed.buzzwords_detected.map(String).slice(0, 12) : [],
    verdict: String(parsed.verdict ?? ''),
    achievement_unlocked: String(parsed.achievement_unlocked ?? ''),
    linkedin_comment_you_will_probably_see: String(parsed.linkedin_comment_you_will_probably_see ?? ''),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    const response = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkedInToEnglishBot/1.0)',
        Accept: 'text/html',
      },
    });
    if (!response.ok) {
      return '';
    }
    const html = await response.text();
    return stripHtml(html).slice(0, 6000);
  } catch {
    return '';
  }
}

async function analyzeWithModel(post: string, url: string | undefined, fetchedContent: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai';
  const model = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';

  if (!apiKey) {
    return fallbackAnalysis(post, url, fetchedContent);
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 1.0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are the meanest, funniest roast comedian alive, running the roast engine for a playful app called LinkedIn to English. Every post gets torched: the humblebragging, the fake vulnerability, the buzzword soup, the engagement-bait, the thought-leadership cosplay, the fauxthenticity, the 'here's what my toddler taught me about Q3 revenue' nonsense. Use sharp, specific, mocking sarcasm — comparisons, mock-quotes, exaggerated impressions of the author's inner monologue, callbacks to exactly what they wrote. No hedging, no compliments, no 'but also this is impressive' softening, no polite disclaimers, no therapy-speak. Assume every ounce of sincerity in the post is a performance and roast it accordingly. Push every field brutally, including the verdict and achievement_unlocked — those should sting as much as the translation. One hard line, non-negotiable: never attack the poster's protected characteristics (race, gender, disability, etc.) and never frame it as an attack on their worth as a human being — the target is the writing and LinkedIn culture, not the person. Keep responses concise. Return only valid JSON with keys: translation (string), authenticity_score (a bare integer 0-100, no percent sign or units), corporate_influencer_score (a bare integer 0-100, no percent sign or units), buzzwords_detected (array of strings), verdict (string), achievement_unlocked (string), linkedin_comment_you_will_probably_see (string).",
        },
        {
          role: 'user',
          content: `LinkedIn post text (pasted by user):\n${post || '(none pasted)'}\n\nContent fetched from the URL:\n${fetchedContent || '(none fetched)'}\n\nLinkedIn URL:\n${url || '(none provided)'}`,
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

    let fetchedContent = '';
    if (url) {
      fetchedContent = await fetchUrlContent(url);
      if (!post && fetchedContent.length < 40) {
        sendJson(response, 422, {
          error:
            "That link is hiding behind LinkedIn's login wall, as cowardly corporate content often does. Paste the post text instead so the roast has something to chew on.",
        });
        return;
      }
    }

    const result = await analyzeWithModel(post, url, fetchedContent);
    sendJson(response, 200, result);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'The translator tripped over a synergy deck. Try again.' });
  }
});

server.listen(PORT, () => {
  console.log(`LinkedIn -> English API running on http://localhost:${PORT}`);
});
