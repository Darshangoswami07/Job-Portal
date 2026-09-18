/**
 * Search relevance evaluation harness (PLAN.md §7 — search relevance).
 *
 * This module is NOT on the request path. It exists so we can measure the
 * current MongoDB `$text` ranking empirically before deciding whether an Atlas
 * Search migration is justified. The controller keeps using `buildGroupSearchFilter`
 * unchanged; this only observes.
 *
 * `BENCHMARK_JOBS` is a tiny synthetic catalogue. `BENCHMARK_QUERIES` maps a
 * query to the ids that a good ranker should surface first. `evaluate()` runs a
 * caller-supplied search function over the queries and returns precision@k /
 * MRR / nDCG-ish numbers — no assertions, no ranking hard-codes.
 */

export const BENCHMARK_JOBS = [
  {
    id: "se-generic",
    title: "Software Engineer",
    company: "Acme",
    description:
      "Build and maintain backend and frontend features across our web platform. " +
      "Work with a team of software engineers on APIs, services and tooling.",
    skills: ["javascript", "sql", "rest"],
  },
  {
    id: "se-senior",
    title: "Senior Software Engineer",
    company: "Acme",
    description:
      "Lead the design of large software systems, mentor other software engineers, " +
      "and own critical services end to end. Deep experience across the stack.",
    skills: ["architecture", "javascript", "go"],
  },
  {
    id: "se-intern",
    title: "Software Engineering Intern",
    company: "Acme",
    description:
      "A 12-week internship for students. Pair with a mentor, ship a small software " +
      "project, and learn how a professional engineering team works.",
    skills: ["python"],
  },
  {
    id: "fe-engineer",
    title: "Frontend Engineer",
    company: "Beta",
    description:
      "Own the browser experience: component library, accessibility, performance. " +
      "You will write a lot of React and TypeScript and care about UX.",
    skills: ["react", "typescript", "css"],
  },
  {
    id: "be-engineer",
    title: "Backend Engineer",
    company: "Beta",
    description:
      "Design resilient services and data pipelines. Strong on databases, queues, " +
      "and observability. Node.js and Go on the server, no frontend work.",
    skills: ["node.js", "go", "postgres"],
  },
  {
    id: "node-dev",
    title: "Node.js Developer",
    company: "Gamma",
    description:
      "Build REST and GraphQL APIs in Node.js and Express. Write tests, review code, " +
      "and keep the services fast. Some AWS.",
    skills: ["node.js", "express", "graphql"],
  },
  {
    id: "react-dev",
    title: "React Developer",
    company: "Gamma",
    description:
      "Build rich single-page apps in React. Redux, hooks, React Router, testing " +
      "library. Partner with designers to ship polished interfaces.",
    skills: ["react", "redux", "javascript"],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    company: "Delta",
    description:
      "Turn raw data into dashboards and reports. SQL, spreadsheets, a little Python. " +
      "No application development.",
    skills: ["sql", "python", "tableau"],
  },
];

/**
 * For each query: `relevant` are ids a good ranker puts at the very top,
 * `acceptable` may also appear high without being wrong. Deliberately loose —
 * we assert "related beats unrelated", never an exact order.
 */
export const BENCHMARK_QUERIES = [
  { q: "software engineer", relevant: ["se-generic", "se-senior", "se-intern"], acceptable: ["be-engineer", "fe-engineer"] },
  { q: "senior software engineer", relevant: ["se-senior"], acceptable: ["se-generic"] },
  { q: "software engineering intern", relevant: ["se-intern"], acceptable: ["se-generic"] },
  { q: "frontend engineer", relevant: ["fe-engineer"], acceptable: ["react-dev"] },
  { q: "backend engineer", relevant: ["be-engineer"], acceptable: ["node-dev"] },
  { q: "node.js developer", relevant: ["node-dev"], acceptable: ["be-engineer"] },
  { q: "react developer", relevant: ["react-dev", "fe-engineer"], acceptable: [] },
];

function precisionAtK(rankedIds, relevant, k) {
  const top = rankedIds.slice(0, k);
  if (!top.length) return 0;
  const hits = top.filter((id) => relevant.includes(id)).length;
  return hits / Math.min(k, top.length);
}

function reciprocalRank(rankedIds, relevant) {
  for (let i = 0; i < rankedIds.length; i += 1) {
    if (relevant.includes(rankedIds[i])) return 1 / (i + 1);
  }
  return 0;
}

/**
 * @param {(query: string) => Promise<string[]> | string[]} search  returns ranked ids
 * @param {{ k?: number }} [opts]
 * @returns {Promise<{ perQuery: object[], meanP: number, mrr: number }>}
 */
export async function evaluate(search, { k = 3 } = {}) {
  const perQuery = [];
  for (const { q, relevant, acceptable } of BENCHMARK_QUERIES) {
    const ranked = (await search(q)) || [];
    const good = [...relevant, ...acceptable];
    perQuery.push({
      q,
      ranked,
      pAtK: precisionAtK(ranked, relevant, k),
      pAtKLoose: precisionAtK(ranked, good, k),
      rr: reciprocalRank(ranked, relevant),
      topIsRelevant: ranked.length > 0 && good.includes(ranked[0]),
    });
  }
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    perQuery,
    meanP: mean(perQuery.map((r) => r.pAtKLoose)),
    mrr: mean(perQuery.map((r) => r.rr)),
  };
}
