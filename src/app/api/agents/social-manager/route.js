import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Social Manager v7 — LinkedIn-first per Scripe playbook ($500K ARR/7mo)
// Spec: marketing-ai-agency/agents/social-manager.md (v7.0.0)
//
// Default platform = LinkedIn (founder personal brand, B2B lead-gen).
// 6 new LinkedIn skill modes: foundation, post, carousel, article, calendar, engage.
// Falls back to multi-platform for non-B2B requests.

const LINKEDIN_HOOKS = [
  (t) => `Most ${t} founders make the same mistake. Here's the one nobody talks about.`,
  (t) => `I lost 6 months doing ${t} the wrong way. Here's what I'd do differently.`,
  (t) => `I asked 30 ${t} founders what they regret. The answers surprised me.`,
  (t) => `Stop doing ${t} like it's 2022. Here's what works in 2026.`,
  (t) => `Hot take: ${t} is oversaturated. The 3 things that still win:`,
  (t) => `3 years ago I was terrible at ${t}. Then I changed one thing.`,
  (t) => `The unsexy truth about ${t} that nobody posts about:`,
]

const CAROUSEL_FORMATS = [
  { title: '7 mistakes', slides: ['7 mistakes killing your growth', 'Mistake 1: shipping without talking to users', 'Mistake 2: ignoring distribution', 'Mistake 3: hiring too early', 'Mistake 4: pricing too low', 'Mistake 5: copying competitors', 'Mistake 6: skipping onboarding', 'Mistake 7: not measuring retention', 'Summary: which one hits home?', 'Save this. Follow for more.'] },
  { title: '5-step framework', slides: ['My 5-step framework for shipping fast', 'Step 1: write the user story', 'Step 2: cut scope to 20%', 'Step 3: build the smallest demo', 'Step 4: get 5 users in 24h', 'Step 5: iterate weekly', 'Common pitfalls', 'How long this took me', 'CTA: try it this week', 'Repost if useful'] },
  { title: '3 lessons', slides: ['3 lessons from $0 to $100K', 'Lesson 1: pick a niche', 'Lesson 2: charge from day 1', 'Lesson 3: under-promise, over-deliver', 'How I picked my niche', 'My first $1K month', 'What I wish I knew earlier', 'The biggest unlock', 'Your turn: which lesson?'] },
]

const CONTENT_PILLARS = [
  'Personal story (vulnerability, lessons learned)',
  'Industry contrarian takes (debate, hot takes)',
  'How-to frameworks (step-by-step, templates)',
  'Case studies (specific numbers, real clients)',
  'Behind the scenes (process, failures, tools)',
]

// Auto-detect mode from request
function detectMode(message, explicitMode) {
  if (explicitMode) return explicitMode
  const m = message.toLowerCase()
  if (m.includes('profile') || m.includes('positioning') || m.includes('pillars')) return 'linkedin-foundation'
  if (m.includes('carousel') || m.includes('pdf') || m.includes('swipe')) return 'linkedin-carousel'
  if (m.includes('article') || m.includes('long form') || m.includes('essay')) return 'linkedin-article'
  if (m.includes('calendar') || m.includes('30 day') || m.includes('plan')) return 'linkedin-calendar'
  if (m.includes('comment') || m.includes('engage') || m.includes('dm') || m.includes('outreach')) return 'linkedin-engage'
  if (m.includes('crisis') || m.includes('pr ')) return 'crisis'
  if (m.includes('audit') || m.includes('review') || m.includes('analyze')) return 'audit'
  if (m.includes('competitor')) return 'competitor'
  return 'linkedin-post' // default
}

function generateLinkedInPost(topic) {
  const hookFn = LINKEDIN_HOOKS[Math.floor(Math.random() * LINKEDIN_HOOKS.length)]
  const hook = hookFn(topic)
  const story = `Last year I was exactly where you are.\n\nI had built the product. I'd done the work. But every time I tried to talk about ${topic}, I sounded like everyone else.\n\nThe breakthrough? I stopped trying to be helpful first. I started being specific first.\n\nSpecific names. Specific numbers. Specific moments.`
  const lesson = `3 things I learned:\n\n1. Specificity beats cleverness — a real name lands harder than a witty turn of phrase\n2. Vulnerability opens doors — admitting "I got this wrong" earns more trust than pretending you got it right\n3. The first line does 80% of the work — if they don't stop scrolling, nothing else matters`
  const reframe = `Most people treat ${topic} as a content problem. It's actually a positioning problem.\n\nWhen you know exactly who you're for and exactly what you stand for, the content writes itself.`
  const cta = `What's the most specific thing you've shipped in ${topic}? Curious what's working for people in 2026.`
  const hashtags = `#${topic.replace(/\s+/g, '')} #founder #buildinpublic`

  return `${hook}\n\n${story}\n\n${lesson}\n\n${reframe}\n\n${cta}\n\n${hashtags}`
}

function generateLinkedInCarousel(topic) {
  const fmt = CAROUSEL_FORMATS[Math.floor(Math.random() * CAROUSEL_FORMATS.length)]
  return `**LinkedIn Carousel: "${fmt.title} for ${topic}"**\n\n` +
    fmt.slides.map((s, i) => `**Slide ${i + 1}:** ${s}`).join('\n\n') +
    `\n\n*Format: PDF, 1080x1350, 8-10 slides, text-dense. Use Canva or Figma.*`
}

function generateLinkedInArticle(topic) {
  return `**LinkedIn Article: "I built a $0->$100K ${topic} playbook. Here's the play I'd run again."**\n\n` +
    `**Title options:**\n` +
    `1. "I built a $0->$100K ${topic} playbook. Here's the play I'd run again."\n` +
    `2. "The 4-step ${topic} framework I wish someone had given me 3 years ago"\n` +
    `3. "Why most ${topic} playbooks fail (and what to do instead)"\n\n` +
    `**Intro (~150 words):**\n` +
    `Most ${topic} advice is recycled. You can tell because the same 5 tweets get reposted every 6 months. I'm going to do something different — share the exact playbook I used, with the parts that failed included.\n\n` +
    `**Body — 5 sections (~400 words each):**\n` +
    `## 1. The first 90 days\n` +
    `(specific tactics, no fluff)\n\n` +
    `## 2. The 3 metrics that mattered\n` +
    `(and the 7 that didn't)\n\n` +
    `## 3. The 2 hires that changed everything\n` +
    `(and the 3 I regret)\n\n` +
    `## 4. The pricing mistake that cost me 6 months\n` +
    `(and how to avoid it)\n\n` +
    `## 5. What I'd do differently if I started today\n` +
    `(specific, actionable)\n\n` +
    `**Conclusion (~100 words):**\n` +
    `This is the playbook. The hardest part isn't reading it — it's running it. Pick one section. Run it for 30 days. Then come back and tell me what happened.\n\n` +
    `**CTA:** What's the #1 ${topic} mistake you've made? Curious what others are seeing in 2026.\n\n` +
    `*Target length: 1,800-2,200 words. Publish cadence: 1-2x/month.*`
}

function generateLinkedInCalendar(topic) {
  // 30-day LinkedIn calendar: 4-5 posts/week, mix of formats
  const days = []
  const startDate = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    // Skip weekends for B2B (post 4-5x/week = Tue, Wed, Thu, Fri, occasional Mon)
    if (dow === 0 || dow === 6) continue
    // Pick format based on day
    const cycle = i % 4
    let format, hook
    if (cycle === 0) {
      format = 'Long-form post (1,200-1,800 chars)'
      hook = `Most ${topic} founders think X. They're wrong.`
    } else if (cycle === 1) {
      format = 'Carousel (8 slides, PDF)'
      hook = `My 5-step ${topic} framework. Save this.`
    } else if (cycle === 2) {
      format = 'Story post (1,200 chars, personal)'
      hook = `I lost 6 months on ${topic}. Here's the one thing I'd change.`
    } else {
      format = 'Hot take (800 chars, contrarian)'
      hook = `Unpopular opinion on ${topic}:`
    }
    days.push({
      date: d.toISOString().slice(0, 10),
      day: d.toDateString().slice(0, 3),
      format,
      hook,
      best_time: dow === 2 || dow === 4 ? '08:30' : '12:15',
      hashtags: `#${topic.replace(/\s+/g, '')} #founder #buildinpublic #${topic.replace(/\s+/g, '')}tips`,
    })
  }
  return days
}

function generateLinkedInFoundation(topic) {
  return `**LinkedIn Founder Foundation for "${topic}"**\n\n` +
    `**Headline (220 chars):**\n` +
    `I help [ICP] achieve [outcome] without [pain]. | ${topic} | DM open for [specific offer]\n\n` +
    `**About (2,600 chars max):**\n` +
    `In the last 5 years I've helped [number] ${topic} [clients/founders] do [specific outcome].\n\n` +
    `Before that: [credibility line — past role, big name, or impressive number].\n\n` +
    `I post daily about ${topic} because [personal reason — what you've learned, who you serve, why you care].\n\n` +
    `Currently: [what you're working on right now, what you're shipping next, where you are in the journey].\n\n` +
    `If you're a [specific ICP] trying to [specific goal], I'd love to connect.\n\n` +
    `**3 Content Pillars (rotate 60/30/10):**\n` +
    CONTENT_PILLARS.map((p, i) => `${i + 1}. ${p} — ${60 - i * 15}% of content`).join('\n') +
    `\n\n**10 Post Ideas to start:**\n` +
    Array.from({ length: 10 }, (_, i) => `${i + 1}. ${LINKEDIN_HOOKS[i % LINKEDIN_HOOKS.length](topic)}`).join('\n') +
    `\n\n*Best time to post first 30 days: Tue/Thu 8:30 AM, founder timezone. 4-5 posts/week.*`
}

function generateLinkedInEngage(topic) {
  return `**LinkedIn Engagement Strategy for "${topic}"**\n\n` +
    `**10 Sample Comments on competitor/peer posts:**\n` +
    Array.from({ length: 10 }, (_, i) =>
      `${i + 1}. "This resonates. We tried [specific tactic] for ${topic} last quarter — saw [specific result]. The hardest part was [honest challenge]."`
    ).join('\n') +
    `\n\n**3 DM Templates (warm outreach, NEVER cold pitch):**\n\n` +
    `**Template 1: After they comment on your post**\n` +
    `"Hey [first name] — saw your comment on my [post topic] post. Curious, are you working on [related thing]? Always looking to swap notes with people in [space]."\n\n` +
    `**Template 2: After you comment on their post (3+ times)**\n` +
    `"Hey [first name] — I've been reading your ${topic} posts for a few weeks. [Specific takeaway from a post]. Would love to compare notes sometime — no pitch, just curious how others are approaching [problem]."\n\n` +
    `**Template 3: After they engage with your newsletter/content**\n` +
    `"Hey [first name] — saw you downloaded the ${topic} playbook. If you want, I can send you the [specific extension] that goes with section 3. Just reply with 'send' and I'll DM it."\n\n` +
    `*Cadence: 10 thoughtful comments/day, 5 DMs/week, max. Never pitch in the first message.*`
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || '').toString().trim()
    const explicitMode = (body.mode || '').toString().trim()
    const platform = (body.platform || 'linkedin').toString().trim().toLowerCase()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A brand/topic brief is required. Example: { message: "B2B SaaS for HR teams" }' },
        { status: 400 }
      )
    }

    const topic = message.split(/\s+/).slice(0, 4).join(' ')
    const stamp = new Date().toISOString()
    const mode = detectMode(message, explicitMode)
    const isLinkedIn = platform === 'linkedin' || mode.startsWith('linkedin-')

    let response, data, calendar

    if (mode === 'linkedin-foundation') {
      response = generateLinkedInFoundation(topic)
      data = { mode, topic, type: 'foundation' }
    } else if (mode === 'linkedin-carousel') {
      response = generateLinkedInCarousel(topic)
      data = { mode, topic, type: 'carousel', slide_count: 8 }
    } else if (mode === 'linkedin-article') {
      response = generateLinkedInArticle(topic)
      data = { mode, topic, type: 'article', target_word_count: 2000 }
    } else if (mode === 'linkedin-calendar') {
      calendar = generateLinkedInCalendar(topic)
      response = `**30-day LinkedIn content calendar for "${topic}"**\n\n` +
        calendar.map(c => `**${c.date} (${c.day})** — *${c.format}*\n> ${c.hook}\n*Best time:* ${c.best_time}\n*Tags:* ${c.hashtags}`).join('\n\n')
      data = { mode, topic, type: 'calendar', posts_planned: calendar.length, calendar }
    } else if (mode === 'linkedin-engage') {
      response = generateLinkedInEngage(topic)
      data = { mode, topic, type: 'engagement', sample_count: 13 }
    } else if (mode === 'linkedin-post' || (isLinkedIn && !['schedule','publish','calendar','strategy','audit','crisis','competitor','full-social'].includes(mode))) {
      const post = generateLinkedInPost(topic)
      response = `**LinkedIn Post (1,200-1,800 chars):**\n\n${post}\n\n*Best time to post: Tue/Thu 8:30 AM or 12:15 PM founder timezone. Length: ${post.length} chars.*`
      data = { mode, topic, type: 'post', char_count: post.length, best_time: 'Tue/Thu 08:30 or 12:15' }
    } else {
      // Fallback: multi-platform 7-day calendar (legacy behavior)
      const formats = [
        { p: 'linkedin', hook: `Most teams in ${topic} make the same mistake.` },
        { p: 'twitter', hook: `Hot take on ${topic}:` },
        { p: 'instagram', hook: `${topic} in 30 seconds:` },
        { p: 'linkedin', hook: `I asked 30 ${topic} founders what they regret.` },
        { p: 'twitter', hook: `Poll:` },
        { p: 'instagram', hook: `Before / after — ${topic}:` },
        { p: 'linkedin', hook: `Weekly recap:` },
      ]
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      calendar = formats.map((f, i) => ({
        day: days[i],
        platform: f.p,
        hook: f.hook,
        best_time: '09:30 local',
      }))
      response = `**7-day multi-platform calendar for "${topic}"**\n\n` +
        calendar.map(p => `**${p.day} — ${p.platform}**\n> ${p.hook}\n*Best time:* ${p.best_time}`).join('\n\n')
      data = { mode, topic, type: 'multi-platform', calendar }
    }

    return NextResponse.json({
      success: true,
      agent: 'social-manager',
      version: '7.0.0',
      specialization: 'linkedin-first',
      research_source: 'Scripe ($500K ARR/7mo from LinkedIn-only)',
      response,
      data: { ...data, platform, generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Social Manager failed' },
      { status: 500 }
    )
  }
}
