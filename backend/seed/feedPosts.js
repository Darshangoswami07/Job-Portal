import { SocialPost } from "../models_new/SocialPost.js";
import { SocialHashtag } from "../models_new/SocialHashtag.js";
import { User } from "../models/user.model.js";

/**
 * Editorial seed posts for the Feed (PLAN: "Feed never feels empty").
 *
 * Every post here is ORIGINAL JobPilot editorial content and is stored with
 * `isEditorial: true` so the UI can badge it ("Featured from JobPilot") and
 * never present it as an organic user post. Covers are original SVGs served
 * from the frontend at /feed/*.svg — nothing is scraped or hotlinked.
 *
 * Authors are a small set of clearly-seeded personas with generic names plus
 * the official JobPilot AI account. They are real User docs so Follow / author
 * navigation work, but they carry `isSeedAccount: true`.
 */

const AUTHORS = {
  jobpilot: {
    email: "editorial@jobpilot.ai",
    fullname: "JobPilot AI",
    headline: "AI-powered career platform · Editorial",
    location: "Remote",
    verified: true,
    skills: ["Careers", "AI", "Hiring", "Software Engineering"],
  },
  aarav: {
    email: "seed.aarav@jobpilot.ai",
    fullname: "Aarav Mehta",
    headline: "Senior Backend Engineer",
    location: "Bengaluru, India",
    skills: ["Node.js", "PostgreSQL", "System Design", "APIs"],
  },
  sara: {
    email: "seed.sara@jobpilot.ai",
    fullname: "Sara Khan",
    headline: "Frontend Engineer",
    location: "Remote",
    skills: ["React", "Next.js", "TypeScript", "Web Performance"],
  },
  devin: {
    email: "seed.devin@jobpilot.ai",
    fullname: "Devin Rao",
    headline: "AI Engineer",
    location: "Pune, India",
    skills: ["Python", "LLMs", "RAG", "FastAPI"],
  },
  meera: {
    email: "seed.meera@jobpilot.ai",
    fullname: "Meera Nair",
    headline: "Engineering Manager & Career Coach",
    location: "Remote",
    skills: ["Leadership", "Hiring", "Interviewing", "DevOps"],
  },
};

const H = 3600000;

/** hours-ago, engagement is intentionally modest and static (seeded content). */
const POSTS = [
  {
    a: "sara", type: "article", cover: "react", read: 5, age: 3,
    title: "5 React performance mistakes that quietly slow down large apps",
    excerpt: "They don't show up in a small demo — but at scale they cost you seconds. Here are the five I see most often in real codebases, and the fix for each.",
    body:
`Most React performance problems aren't exotic. They're the same handful of mistakes, repeated across a large codebase until the app feels sluggish.

1. Context that holds too much. A single provider with a big object re-renders every consumer on any change. Split by concern, or move volatile state to a store.
2. New objects/functions in render passed to memoized children. useMemo/useCallback the props, or the memo does nothing.
3. Lists without stable keys (or keyed by index) — reconciliation thrashes on reorder.
4. Derived data recomputed every render instead of memoized from its inputs.
5. Effects that run on every render because a dependency isn't stable.

Fix the data flow first, then reach for memoization. Profile with the React DevTools "Highlight updates" before and after.`,
    tags: ["react", "javascript", "frontend", "webperformance"],
    likes: 89, comments: 18, shares: 12, saves: 34, views: 1240,
  },
  {
    a: "sara", type: "article", cover: "frontend", read: 6, age: 8,
    title: "Next.js Server Components vs Client Components: when to use each",
    excerpt: "A simple rule of thumb: server by default, client only when you need interactivity or browser APIs. The nuance is in the boundary.",
    body:
`Server Components render on the server and ship zero JS for that subtree. Client Components hydrate and can use state, effects and event handlers.

Use Server Components for: data fetching, reading secrets, large dependencies you don't want in the bundle, and static-ish content.

Use Client Components for: forms, interactive widgets, anything using useState/useEffect, and code that touches window/localStorage.

The trap is the boundary. Once a component is "use client", everything it imports is client too. Keep client components small and push them to the leaves of the tree — a chart, a dropdown, a like button — not the page shell.`,
    tags: ["nextjs", "react", "frontend", "webdev"],
    likes: 64, comments: 11, shares: 9, saves: 41, views: 980,
  },
  {
    a: "aarav", type: "article", cover: "backend", read: 7, age: 14,
    title: "7 backend API design decisions that save you pain later",
    excerpt: "Most API regret is decided in the first week: pagination shape, error format, IDs, versioning. Get these right and future-you is grateful.",
    body:
`Things I wish every service agreed on before writing the first endpoint:

1. One error shape everywhere: { success, message, code }. Clients should never parse prose.
2. Cursor pagination, not offset — offset breaks under writes and gets slow.
3. Opaque string IDs. Don't leak auto-increment counts; don't assume UUID everywhere later.
4. Explicit versioning (/v1) from day one, even if you never ship v2.
5. Timestamps in UTC ISO-8601. Always.
6. Idempotency keys on anything that charges money or sends a message.
7. Return the created/updated resource, not just 200 — saves a round trip.

None of these are hard. All of them are expensive to retrofit.`,
    tags: ["backend", "api", "softwareengineering", "systemdesign"],
    likes: 132, comments: 27, shares: 22, saves: 88, views: 2100,
  },
  {
    a: "aarav", type: "article", cover: "database", read: 6, age: 22,
    title: "PostgreSQL indexing mistakes that hurt production performance",
    excerpt: "Indexes aren't free, and the wrong ones are worse than none. A short field guide to the mistakes that show up under load.",
    body:
`Common ones:

- Indexing low-cardinality columns alone (a boolean). The planner ignores it.
- Missing a composite index for your actual WHERE + ORDER BY, so Postgres sorts on disk.
- Column order in composite indexes wrong — equality columns first, then the range/sort column.
- Not using partial indexes for "hot" subsets (WHERE status = 'active').
- Leaving unused indexes in place — every write pays to maintain them.

Read EXPLAIN (ANALYZE, BUFFERS) on your slow query. If you see a Seq Scan on a big table or an external merge sort, you have your answer.`,
    tags: ["postgresql", "database", "backend", "performance"],
    likes: 97, comments: 19, shares: 14, saves: 71, views: 1560,
  },
  {
    a: "aarav", type: "text", cover: "systemdesign", read: 4, age: 30,
    title: "Monolith vs microservices: what should a small team actually choose?",
    excerpt: "If you're under ~15 engineers, a well-structured modular monolith almost always wins. Microservices trade code complexity for operational complexity.",
    body:
`Microservices solve an organizational problem: many teams needing to deploy independently. If you have one or two teams, you don't have that problem yet — you just get distributed transactions, network failures between your own code, and five dashboards to check.

Start with a modular monolith: clear module boundaries, no cross-module DB access, a domain layer that could be split later. Extract a service only when a real seam appears — a component with a different scaling profile, or a team that genuinely needs autonomy.`,
    tags: ["systemdesign", "backend", "architecture", "softwareengineering"],
    likes: 156, comments: 42, shares: 28, saves: 61, views: 3200,
  },
  {
    a: "aarav", type: "article", cover: "backend", read: 6, age: 38,
    title: "How to structure a scalable Node.js backend",
    excerpt: "Layering by responsibility (routes → controllers → services → data) keeps a Node codebase testable as it grows. Here's a structure that holds up.",
    body:
`A structure that scales past a few thousand lines:

- routes/ — HTTP wiring only. No logic.
- controllers/ — parse/validate input, call a service, shape the response.
- services/ — business logic. Pure-ish, unit-testable, no req/res.
- models/ or repositories/ — data access.
- middlewares/, utils/, config/.

Rules that matter more than the folders: controllers never touch the database directly; services never touch req/res; anything with external I/O is injected so you can test it. Keep the dependency arrows pointing inward.`,
    tags: ["nodejs", "backend", "architecture", "softwareengineering"],
    likes: 78, comments: 14, shares: 11, saves: 52, views: 1120,
  },
  {
    a: "devin", type: "article", cover: "ai", read: 7, age: 5,
    title: "RAG isn't just vector search: the retrieval pipeline that actually matters",
    excerpt: "Embedding your docs and querying a vector DB is step one. The quality of a RAG system lives in chunking, re-ranking, and knowing when NOT to answer.",
    body:
`A production RAG pipeline is more than "embed + nearest neighbours":

- Chunking strategy: semantic or structural chunks beat fixed 500-token windows. Keep headings with their content.
- Hybrid retrieval: combine dense (embeddings) with sparse (BM25). Each catches what the other misses.
- Re-ranking: pull top 20, re-rank with a cross-encoder, keep top 4. This is the single biggest quality lever.
- Query rewriting: expand or decompose the user's question before retrieval.
- Grounding + refusal: if retrieved context doesn't support an answer, say so. A confident wrong answer is worse than "I don't know".

The vector DB is a component, not the system.`,
    tags: ["ai", "rag", "llm", "backend"],
    likes: 214, comments: 38, shares: 47, saves: 163, views: 4800,
  },
  {
    a: "devin", type: "article", cover: "ai", read: 5, age: 26,
    title: "MCP explained: giving AI assistants a real interface to your tools",
    excerpt: "The Model Context Protocol standardizes how an assistant discovers and calls your tools, reads your resources, and runs your prompts — without bespoke glue per client.",
    body:
`Before MCP, every assistant integration was custom: your own function schemas, your own auth, your own transport. MCP defines a small contract:

- Tools: callable actions with typed inputs the model can invoke.
- Resources: readable data (files, rows, docs) the model can pull into context.
- Prompts: reusable templated interactions.

A server exposes these once; any MCP-aware client (an IDE assistant, a chat app) can use them. The win isn't magic capability — it's that you write the integration once instead of N times.`,
    tags: ["ai", "mcp", "llm", "developertools"],
    likes: 141, comments: 22, shares: 31, saves: 118, views: 2600,
  },
  {
    a: "devin", type: "article", cover: "ai", read: 6, age: 44,
    title: "Building a production-ready FastAPI service: the pieces people forget",
    excerpt: "The endpoints are the easy part. Config, lifespan, structured errors, background work, and observability are what make it production-ready.",
    body:
`Going from a tutorial FastAPI app to something you'd put on call:

- Settings via pydantic-settings, not scattered os.getenv.
- Lifespan handlers to open/close DB pools and clients once.
- A consistent error model + exception handlers, so clients get { detail, code }.
- Pagination and request-size limits on every list endpoint.
- Background tasks or a real queue for anything slow — don't block the request.
- Structured logging with a request id, plus /health and basic metrics.
- Async all the way down, or you'll starve the event loop with a sync DB call.`,
    tags: ["fastapi", "python", "backend", "api"],
    likes: 118, comments: 21, shares: 19, saves: 97, views: 2050,
  },
  {
    a: "sara", type: "article", cover: "frontend", read: 5, age: 18,
    title: "Why TypeScript generics get hard — and how to simplify them",
    excerpt: "Most painful generic code is doing too much at once. Name your type parameters, constrain them early, and lean on inference instead of fighting it.",
    body:
`Generics feel hard when a signature tries to be maximally flexible. Practical fixes:

- Constrain with extends as early as possible — <T extends { id: string }> tells the compiler and the reader what T is.
- Let inference work: don't pass type arguments the compiler can infer from parameters.
- Extract conditional/mapped types into named aliases so the signature stays readable.
- Prefer a couple of overloads over one clever conditional return type when there are only two shapes.
- If you're reaching for infer three levels deep, step back — a small refactor of the runtime code often removes the need.`,
    tags: ["typescript", "javascript", "frontend", "softwareengineering"],
    likes: 92, comments: 16, shares: 13, saves: 74, views: 1680,
  },
  {
    a: "meera", type: "text", cover: "devops", read: 4, age: 12,
    title: "Docker mistakes that make images huge and builds slow",
    excerpt: "Layer order, multi-stage builds, and a real .dockerignore fix most of it. Your node_modules do not belong in the final image.",
    body:
`The usual suspects:

- No .dockerignore, so the build context ships .git, node_modules and local env files.
- Copying everything before installing deps — any source change busts the dependency cache.
- Single-stage builds that keep compilers and dev deps in the runtime image.
- Running as root.
- :latest base images, so builds aren't reproducible.

A multi-stage build (build stage → slim runtime stage), COPY package files first, then source, and a non-root USER will cut most images in half and make rebuilds seconds instead of minutes.`,
    tags: ["docker", "devops", "cloud", "backend"],
    likes: 103, comments: 17, shares: 20, saves: 66, views: 1740,
  },
  {
    a: "meera", type: "advice", cover: "career", read: 6, age: 6,
    title: "How to prepare for a Full Stack Software Engineer interview in 2026",
    excerpt: "A four-week plan: data structures for the coding round, one system design template, a project you can defend line by line, and behavioral stories with numbers.",
    body:
`What actually moves the needle:

Weeks 1–2 — Coding: arrays/strings, hashing, two pointers, trees/graphs, and one dynamic-programming pattern. 3–4 problems a day, out loud.
Week 3 — System design: learn one template (requirements → API → data model → scale → trade-offs) and apply it to 5 classic prompts (URL shortener, feed, chat, rate limiter, file store).
Week 4 — Your project: be able to explain every architectural decision and what you'd change. Prepare 4–5 behavioral stories in STAR form, each with a measurable outcome.

Mock interviews > passive reading. Record yourself once — it's uncomfortable and useful.`,
    tags: ["career", "interviewpreparation", "softwareengineering", "fullstack"],
    likes: 187, comments: 34, shares: 41, saves: 220, views: 5200,
  },
  {
    a: "meera", type: "advice", cover: "career", read: 4, age: 20,
    title: "5 practical ways to improve your GitHub profile for recruiters",
    excerpt: "Recruiters skim. A pinned project with a real README, a clean commit history, and a one-line profile bio does more than 50 tutorial repos.",
    body:
`Fast wins:

1. A profile README: who you are, what you build, how to reach you.
2. Pin 3–4 projects that show range — not 6 forks of tutorials.
3. Each pinned repo needs a README with: what it does, a screenshot or demo link, how to run it, and the stack.
4. Squash the "fix typo" noise on your main branch; recruiters do open the commit log.
5. Ship one thing end to end — deployed, with a link. A live URL beats a wall of green squares.`,
    tags: ["career", "github", "portfolio", "jobsearch"],
    likes: 145, comments: 23, shares: 30, saves: 176, views: 3900,
  },
  {
    a: "meera", type: "advice", cover: "career", read: 5, age: 33,
    title: "Remote software engineering: the skills companies actually screen for",
    excerpt: "Async written communication, self-directed scoping, and over-communicating status. The coding bar is the same — the collaboration bar is higher.",
    body:
`Remote-first teams filter for:

- Clear async writing: a PR description, a design doc, a status update that doesn't need a follow-up call.
- Scoping your own work: turning a vague ticket into a plan without a manager in the room.
- Proactive status: flagging a blocker on day one, not at the deadline.
- Overlap discipline: being reachable in the agreed hours, and genuinely offline otherwise.
- Documentation instinct: writing the thing down so it's not trapped in your head.

Show these in the interview: send a crisp follow-up, ask scoping questions, summarize decisions back.`,
    tags: ["remotejobs", "career", "softwareengineering", "communication"],
    likes: 121, comments: 19, shares: 24, saves: 98, views: 2400,
  },
  {
    a: "jobpilot", type: "article", cover: "career", read: 5, age: 2,
    title: "How to build a developer portfolio that gets you hired in 2026",
    excerpt: "Your portfolio is proof of skill, problem-solving and taste. We cover what to include, the common mistakes, and how to make it stand out to recruiters.",
    body:
`A portfolio that works has three jobs: prove you can build, prove you can finish, and prove you can communicate.

Include: 2–4 projects that are deployed and linked, each with a short write-up of the problem, your approach, and the trade-offs. One should be non-trivial — auth, data, a real integration.

Skip: unfinished "in progress" projects, clones with no added thinking, and a wall of small tutorials.

Make it stand out: a one-paragraph case study per project beats a screenshot. Show a decision you got wrong and fixed. Keep the site itself fast and clean — it's your first code sample.

JobPilot AI's resume and portfolio tools can turn these write-ups into recruiter-ready summaries.`,
    tags: ["career", "portfolio", "webdevelopment", "jobtips"],
    likes: 142, comments: 24, shares: 36, saves: 128, views: 3100,
  },
  {
    a: "jobpilot", type: "text", cover: "ai", read: 4, age: 10,
    title: "How AI coding assistants are changing developer workflows",
    excerpt: "The job is shifting from typing code to reviewing it, specifying it precisely, and knowing the codebase well enough to catch a confident wrong answer.",
    body:
`What we're seeing across teams using AI assistants day to day:

- More time in review, less in initial authoring. Reading skill is now a core skill.
- Precise specs pay off. A clear prompt with constraints beats a vague one plus three corrections.
- Codebase knowledge matters more, not less — you have to recognize when the suggestion is subtly wrong.
- Tests and types are load-bearing. They're how you keep generated code honest.
- Juniors who learn to verify rather than trust ramp faster than those who do either extreme.`,
    tags: ["ai", "developertools", "softwareengineering", "productivity"],
    likes: 168, comments: 29, shares: 25, saves: 84, views: 3600,
  },
];

async function ensureAuthor(key) {
  const spec = AUTHORS[key];
  let user = await User.findOne({ email: spec.email });
  if (user) return user;
  user = await User.create({
    fullname: spec.fullname,
    email: spec.email,
    password: "seed-account-not-for-login",
    profileCompleted: true,
    profileCompletionScore: 90,
    roles: { jobSeeker: true },
    currentRole: "jobSeeker",
    isSeedAccount: true,
    profile: {
      headline: spec.headline,
      location: spec.location,
      skills: spec.skills || [],
      bio: `${spec.fullname} — ${spec.headline}. Seeded editorial contributor on JobPilot AI.`,
      verificationStatus: spec.verified ? "verified" : "pending",
    },
  });
  return user;
}

export async function seedFeedPosts() {
  try {
    const existing = await SocialPost.countDocuments({ isEditorial: true, status: "active" });
    if (existing >= POSTS.length) {
      console.log(`✓ ${existing} editorial feed posts already present — skipping seed`);
      return;
    }

    const authorIds = {};
    for (const key of Object.keys(AUTHORS)) {
      const u = await ensureAuthor(key);
      authorIds[key] = u._id;
    }

    const tagCounts = new Map();
    const docs = POSTS.map((p) => {
      const hashtags = [...new Set(p.tags.map((t) => t.toLowerCase()))];
      hashtags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
      const when = new Date(Date.now() - p.age * H);
      const contentText = `${p.title}\n\n${p.body}`;
      return {
        author: authorIds[p.a],
        type: p.type,
        content: `${p.body}\n\n${hashtags.map((t) => `#${t}`).join(" ")}`,
        contentText,
        visibility: "public",
        hashtags,
        isEditorial: true,
        excerpt: p.excerpt,
        coverImage: `/feed/${p.cover}.svg`,
        readTime: p.read,
        source: { name: "JobPilot Insights", url: "" },
        article:
          p.type === "article"
            ? { title: p.title, coverUrl: `/feed/${p.cover}.svg`, readingTime: p.read }
            : { title: p.title, coverUrl: `/feed/${p.cover}.svg`, readingTime: p.read },
        reactionCounts: { like: p.likes, love: 0, celebrate: 0, insightful: Math.round(p.likes * 0.2), support: 0, funny: 0, applause: 0 },
        commentCount: p.comments,
        shareCount: p.shares,
        bookmarkCount: p.saves,
        viewCount: p.views,
        moderation: { reviewed: true, flaggedBySystem: false, flagReason: "" },
        createdAt: when,
        updatedAt: when,
      };
    });

    await SocialPost.insertMany(docs);

    // Reflect the seeded tags in the trending hashtag collection.
    for (const [name, count] of tagCounts) {
      await SocialHashtag.updateOne(
        { name },
        { $inc: { postCount: count }, $setOnInsert: { name } },
        { upsert: true }
      );
    }

    console.log(`✓ Seeded ${docs.length} editorial feed posts`);
  } catch (err) {
    console.error("Feed post seed failed:", err.message);
  }
}
