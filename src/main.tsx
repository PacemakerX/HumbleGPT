import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Award,
  BadgeCheck,
  BarChart3,
  Clipboard,
  Flame,
  Loader2,
  MessageSquareQuote,
  Send,
  Sparkles,
  Trophy,
} from 'lucide-react';
import './styles.css';

type AnalysisResult = {
  translation: string;
  authenticity_score: number;
  corporate_influencer_score: number;
  buzzwords_detected: string[];
  verdict: string;
  achievement_unlocked: string;
  linkedin_comment_you_will_probably_see: string;
};

const loadingMessages = [
  'Decoding corporate language...',
  'Measuring thought leadership...',
  'Detecting strategic humility...',
  'Counting buzzwords...',
];

const footerMessages = [
  'Somewhere, a recruiter liked this.',
  'Visibility has increased by 27%.',
  'Thought leadership levels are rising.',
  "Congratulations, you've unlocked Professional Storytelling.",
  'The algorithm has accepted your offering.',
  'Engagement aura: professionally luminous.',
];

const samplePosts = [
  "I'm thrilled to share that I've started a new role! Humbled by the journey, grateful for the opportunity, and excited for the growth ahead. Here's to leadership, innovation, and making an impact.",
  "Today I learned that failure is not the opposite of success, it is a stakeholder in your growth roadmap. Grateful for every rejection that shaped my journey.",
  "Honored to speak at this year's innovation summit. Incredible conversations about leadership, community, and the future of work. The journey continues!",
];

function scoreCategory(score: number, type: 'authenticity' | 'influencer') {
  const authenticity = [
    'Pure LinkedIn Energy',
    'Strategic Humility',
    'Mostly Genuine',
    'Pretty Authentic',
    'Surprisingly Human',
  ];
  const influencer = ['Normal Human', 'Occasional Poster', 'Networking Enjoyer', 'Thought Leader', 'LinkedIn Final Boss'];
  const index = score <= 20 ? 0 : score <= 40 ? 1 : score <= 60 ? 2 : score <= 80 ? 3 : 4;
  return type === 'authenticity' ? authenticity[index] : influencer[index];
}

function App() {
  const [post, setPost] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingIndex, setLoadingIndex] = React.useState(0);
  const [error, setError] = React.useState('');
  const [footerMessage, setFooterMessage] = React.useState(footerMessages[0]);

  React.useEffect(() => {
    if (!isLoading) return;
    const interval = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingMessages.length);
    }, 900);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  async function analyzePost(event: React.FormEvent) {
    event.preventDefault();
    if (!post.trim() && !url.trim()) {
      setError('The translator needs at least one humblebrag to chew on.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setLoadingIndex(Math.floor(Math.random() * loadingMessages.length));

    try {
      const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, 1800));
      const request = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post, url }),
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Analysis failed.');
        }
        return data as AnalysisResult;
      });

      const [analysis] = await Promise.all([request, minimumDelay]);
      setResult(analysis);
      setFooterMessage(footerMessages[Math.floor(Math.random() * footerMessages.length)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went sideways.');
    } finally {
      setIsLoading(false);
    }
  }

  function loadSample() {
    setPost(samplePosts[Math.floor(Math.random() * samplePosts.length)]);
    setUrl('');
    setError('');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-slate-50">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-18rem] top-[-16rem] h-[42rem] w-[42rem] rounded-full bg-linkedin-500/20 blur-3xl" />
        <div className="absolute bottom-[-18rem] right-[-18rem] h-[40rem] w-[40rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(76,179,255,0.16),transparent_34%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,46px_46px,46px_46px]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 bg-white/10 shadow-glow backdrop-blur">
              <Sparkles className="h-5 w-5 text-linkedin-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-linkedin-400">Workshop Demo</p>
              <h1 className="text-2xl font-black tracking-normal sm:text-3xl">LinkedIn -&gt; English</h1>
            </div>
          </div>
          <button className="ghost-button" type="button" onClick={loadSample}>
            <Clipboard className="h-4 w-4" />
            Load sample
          </button>
        </header>

        <div className="grid flex-1 items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="animate-reveal">
            <div className="mb-6 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/80">Corporate decoder</p>
              <h2 className="mt-3 text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
                Translate polished ambition into regular human English.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Paste the inspirational post. Press the blue button. Receive a workplace-safe roast with measurable
                thought leadership emissions.
              </p>
            </div>

            <form className="glass-panel space-y-4 p-4 sm:p-5" onSubmit={analyzePost}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">LinkedIn post</span>
                <textarea
                  className="input min-h-[230px] resize-none"
                  placeholder="Paste the most inspirational LinkedIn post you've seen today..."
                  value={post}
                  onChange={(event) => setPost(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">LinkedIn URL optional</span>
                <input
                  className="input"
                  placeholder="https://www.linkedin.com/posts/..."
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </label>

              {error && (
                <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <button className="primary-button" disabled={isLoading} type="submit">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isLoading ? loadingMessages[loadingIndex] : 'Translate to English'}
              </button>
            </form>
          </section>

          <section className="min-h-[620px]">
            {result ? <Results result={result} footerMessage={footerMessage} /> : <EmptyState isLoading={isLoading} />}
          </section>
        </div>
      </section>
    </main>
  );
}

function EmptyState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="glass-panel flex min-h-[620px] animate-float flex-col items-center justify-center p-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl border border-linkedin-400/30 bg-linkedin-500/20 shadow-glow">
        {isLoading ? <Loader2 className="h-9 w-9 animate-spin text-linkedin-400" /> : <MessageSquareQuote className="h-9 w-9 text-linkedin-400" />}
      </div>
      <h3 className="mt-6 text-2xl font-black tracking-normal">
        {isLoading ? 'The humility scanner is warming up.' : 'Awaiting professional inspiration.'}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
        {isLoading
          ? 'Please remain aligned with stakeholder expectations while the buzzwords are processed.'
          : 'Your translation cards will appear here with scores, badges, verdicts, and suspiciously supportive comments.'}
      </p>
    </div>
  );
}

function Results({ result, footerMessage }: { result: AnalysisResult; footerMessage: string }) {
  return (
    <div className="grid animate-reveal gap-4">
      <article className="glass-panel border-linkedin-400/35 p-5 shadow-glow sm:p-6">
        <div className="flex items-center gap-3 text-linkedin-400">
          <MessageSquareQuote className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Plain English Translation</h3>
        </div>
        <p className="mt-5 text-3xl font-black leading-tight tracking-normal text-white sm:text-4xl">{result.translation}</p>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard
          icon={<BadgeCheck className="h-5 w-5" />}
          title="Authenticity Score"
          score={result.authenticity_score}
          category={scoreCategory(result.authenticity_score, 'authenticity')}
          tone="cyan"
        />
        <ScoreCard
          icon={<Flame className="h-5 w-5" />}
          title="Corporate Influencer Score"
          score={result.corporate_influencer_score}
          category={scoreCategory(result.corporate_influencer_score, 'influencer')}
          tone="blue"
        />
      </div>

      <article className="glass-panel p-5">
        <div className="flex items-center gap-3 text-cyan-200">
          <BarChart3 className="h-5 w-5" />
          <h3 className="card-title">Buzzwords Detected</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.buzzwords_detected.map((word) => (
            <span className="badge" key={word}>
              {word}
            </span>
          ))}
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        <MiniCard icon={<Award className="h-5 w-5" />} title="Verdict" value={result.verdict} />
        <MiniCard icon={<Trophy className="h-5 w-5" />} title="Achievement Unlocked" value={result.achievement_unlocked} />
      </div>

      <article className="glass-panel p-5">
        <div className="flex items-center gap-3 text-cyan-200">
          <MessageSquareQuote className="h-5 w-5" />
          <h3 className="card-title">Predicted LinkedIn Comment</h3>
        </div>
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.07] px-4 py-4 text-lg font-semibold text-white">
          "{result.linkedin_comment_you_will_probably_see}"
        </p>
      </article>

      <p className="rounded-lg border border-linkedin-400/20 bg-linkedin-500/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100">
        {footerMessage}
      </p>
    </div>
  );
}

function ScoreCard({
  icon,
  title,
  score,
  category,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  score: number;
  category: string;
  tone: 'cyan' | 'blue';
}) {
  const barClass = tone === 'cyan' ? 'from-cyan-300 to-emerald-300' : 'from-linkedin-400 to-fuchsia-300';
  return (
    <article className="glass-panel p-5">
      <div className="flex items-center gap-3 text-cyan-200">
        {icon}
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="text-5xl font-black tracking-normal text-white">{score}</p>
        <p className="pb-2 text-right text-sm font-bold text-slate-200">{category}</p>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${barClass}`} style={{ width: `${score}%` }} />
      </div>
    </article>
  );
}

function MiniCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <article className="glass-panel p-5">
      <div className="flex items-center gap-3 text-cyan-200">
        {icon}
        <h3 className="card-title">{title}</h3>
      </div>
      <p className="mt-4 text-xl font-black leading-snug tracking-normal text-white">{value}</p>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
