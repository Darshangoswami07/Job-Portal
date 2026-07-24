import { InterviewQuestion } from "../models_new/InterviewQuestion.js";

const ALL_COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Airbnb",
  "Stripe", "Atlassian", "Adobe", "Oracle", "OpenAI", "NVIDIA", "TCS", "Infosys",
  "Accenture", "Wipro", "Goldman Sachs", "JP Morgan", "LinkedIn", "Twitter/X",
  "Spotify", "Salesforce", "IBM", "Intel", "Cisco", "PayPal", "Shopify", "Square"
];

const ROLES = {
  "Frontend": ["Frontend Developer", "UI Engineer", "Full Stack Developer", "Web Developer"],
  "Backend": ["Backend Developer", "Full Stack Developer", "API Engineer", "Software Engineer"],
  "Programming": ["Software Engineer", "Backend Engineer", "Systems Engineer", "SDE"],
  "Database": ["Database Engineer", "Backend Developer", "Data Engineer", "Full Stack Developer"],
  "Cloud": ["Cloud Engineer", "DevOps Engineer", "Platform Engineer", "Site Reliability Engineer"],
  "DevOps": ["DevOps Engineer", "SRE", "Platform Engineer", "Cloud Engineer"],
  "AI": ["AI Engineer", "Machine Learning Engineer", "Data Scientist", "Research Engineer"],
  "System Design": ["Software Engineer", "Senior Engineer", "Staff Engineer", "Solutions Architect"],
  "DSA": ["SDE", "Software Engineer", "Backend Engineer", "Competitive Programmer"],
  "HR": ["Any Role", "Software Engineer", "Manager", "Individual Contributor"],
};

const EXPLANATIONS = {
  "Frontend": "This question tests your understanding of frontend technologies and best practices.",
  "Backend": "This evaluates your backend development knowledge and server-side expertise.",
  "Programming": "This assesses your programming language proficiency and software design skills.",
  "Database": "This checks your database knowledge and data management capabilities.",
  "Cloud": "This tests your cloud architecture knowledge and infrastructure experience.",
  "DevOps": "This evaluates your DevOps practices and operational expertise.",
  "AI": "This assesses your AI/ML knowledge and ability to apply modern AI techniques.",
  "System Design": "This evaluates your system design skills and architectural thinking.",
  "DSA": "This tests your data structures and algorithms problem-solving abilities.",
  "HR": "This is a behavioral interview question that assesses soft skills and cultural fit.",
};

function pick(arr) {
  return [...arr].sort(() => Math.random() - 0.5)[0];
}

function pickMany(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion({ question, answer, category, subcategory, difficulty, company, companies, tags, role, expLevel, timeEst, explanation }) {
  return {
    question, answer, explanation: explanation || EXPLANATIONS[category] || "",
    category, subcategory,
    difficulty: difficulty || pick(["easy", "medium", "hard"]),
    company: company || (companies ? companies[0] : "General"),
    companies: companies || [],
    tags: tags || [],
    technology: subcategory || category,
    role: role || pick(ROLES[category] || ["Software Engineer"]),
    experienceLevel: expLevel || pick(["entry", "junior", "mid", "senior"]),
    timeEstimate: timeEst || randInt(3, 15),
    votes: randInt(10, 2000),
    popularity: randInt(100, 9900),
    isPublished: true, source: "curated",
    viewedCount: randInt(500, 100000),
    solvedCount: randInt(20, 8000),
    commonMistakes: `Common mistakes include not understanding the fundamentals, rushing to implementation, and ignoring edge cases.`,
    bestPractices: `Study the core concepts thoroughly, practice with real projects, and follow industry best practices.`,
    followUpQuestions: [
      `How would you apply this in a production environment?`,
      `What are the performance implications?`,
      `How does this compare with alternative approaches?`,
    ],
    companyFrequency: Object.fromEntries((companies || []).map(c => [c, randInt(5, 200)])),
  };
}

function generateCategory(cat, subcat, topics) {
  const questions = [];
  const templates = [
    (t, sc) => `Explain ${t} in ${sc} with practical examples.`,
    (t, sc) => `How does ${t} work in ${sc} and when should you use it?`,
    (t, sc) => `What are the best practices for implementing ${t} in ${sc}?`,
    (t, sc) => `Compare ${t} with similar concepts in ${sc}.`,
    (t, sc) => `What are common mistakes when using ${t} in ${sc} and how to avoid them?`,
    (t, sc) => `Describe a real-world scenario where ${t} is applied in ${sc}.`,
    (t, sc) => `How would you debug issues related to ${t} in ${sc}?`,
    (t, sc) => `What are the performance implications of using ${t} in ${sc}?`,
  ];
  const answerTemplates = [
    (t, sc) => `${t} is a core concept in ${sc}. It enables developers to ${["build efficient solutions", "handle complex requirements", "optimize performance", "improve code quality", "manage state effectively"][randInt(0, 4)]}. When implementing, consider ${["edge cases", "performance trade-offs", "maintainability", "scalability"][randInt(0, 3)]}.`,
    (t, sc) => `Working with ${t} in ${sc} requires understanding ${["the underlying mechanisms", "the API surface", "common patterns", "best practices"][randInt(0, 3)]}. Start by ${["reading the documentation", "setting up a test project", "understanding the basics", "looking at examples"][randInt(0, 3)]}. Then ${["implement incrementally", "test thoroughly", "optimize as needed", "refactor for clarity"][randInt(0, 3)]}.`,
    (t, sc) => `${t} in ${sc} follows specific patterns: ${["first understand the requirements", "choose the right approach", "implement carefully", "test and validate"][randInt(0, 3)]}. Key benefits include ${["improved maintainability", "better performance", "cleaner code", "enhanced developer experience"][randInt(0, 3)]}. Common pitfalls include ${["over-engineering", "premature optimization", "ignoring edge cases", "not following conventions"][randInt(0, 3)]}.`,
  ];

  for (const sc of subcat) {
    const subTopics = topics[sc] || topics;
    for (const t of subTopics) {
      for (let v = 0; v < 5; v++) {
        const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
        const diff = pick(["easy", "easy", "medium", "medium", "medium", "hard", "hard"]);
        const qTemplate = pick(templates);
        const aTemplate = pick(answerTemplates);
        questions.push(makeQuestion({
          question: qTemplate(t, sc),
          answer: aTemplate(t, sc),
          category: cat, subcategory: sc,
          difficulty: diff, companies,
          tags: [cat.toLowerCase(), sc.toLowerCase(), ...t.toLowerCase().split(" ").filter(w => w.length > 2)],
          timeEst: diff === "easy" ? randInt(2, 5) : diff === "medium" ? randInt(5, 12) : randInt(10, 25),
        }));
      }
    }
  }
  return questions;
}

function generateFrontendQuestions() {
  return generateCategory("Frontend",
    ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Tailwind CSS"],
    {
      "HTML": ["semantic elements", "ARIA attributes", "localStorage", "Canvas API", "Web Workers", "Service Workers", "form validation", "accessible forms", "SVG", "custom elements", "shadow DOM", "HTML5 APIs", "geolocation API", "drag and drop", "web sockets", "event delegation", "DOM manipulation", "viewport meta tag", "responsive images", "template element"],
      "CSS": ["Flexbox", "CSS Grid", "CSS Variables", "CSS animations", "transitions", "media queries", "pseudo-classes", "pseudo-elements", "CSS specificity", "BEM methodology", "CSS Modules", "positioning", "z-index stacking", "CSS preprocessors", "Tailwind CSS", "responsive design", "CSS custom properties", "CSS transforms", "CSS filters", "container queries"],
      "JavaScript": ["closures", "promises", "async/await", "event loop", "prototypal inheritance", "callbacks", "Array.map()", "spread operator", "destructuring", "arrow functions", "modules", "generators", "Proxy", "Reflect", "Symbol", "WeakMap", "Map vs Object", "hoisting", "temporal dead zone", "strict mode"],
      "TypeScript": ["interfaces vs types", "generics", "utility types", "decorators", "enums", "type guards", "conditional types", "mapped types", "indexed access types", "template literal types", "infer keyword", "satisfies operator", "union types", "intersection types", "branded types", "module augmentation", "declaration files", "type inference", "keyof operator", "typeof operator"],
      "React": ["useState", "useEffect", "useCallback", "useMemo", "React.memo", "Context API", "custom hooks", "React Server Components", "Suspense", "lazy loading", "error boundaries", "portals", "refs", "forwardRef", "controlled components", "compound components", "render props", "higher-order components", "React 19 features", "concurrent mode"],
      "Next.js": ["App Router", "Server Components", "SSR", "SSG", "ISR", "middleware", "API routes", "server actions", "client components", "image optimization", "layout system", "route groups", "parallel routes", "intercepting routes", "loading UI", "error UI", "data fetching", "caching", "revalidation", "Edge Runtime"],
      "Vue": ["composition API", "options API", "ref vs reactive", "computed properties", "watchers", "Vue Router", "Pinia", "slots", "provide/inject", "transitions", "teleport", "suspense", "custom directives", "mixins", "composables", "render functions", "SSR with Nuxt", "Vue DevTools", "async components", "Vue 3 features"],
      "Angular": ["signals", "standalone components", "control flow syntax", "dependency injection", "RxJS", "HttpClient", "interceptors", "guards", "resolvers", "lazy loading", "Universal SSR", "change detection", "content projection", "view encapsulation", "pipes", "directives", "forms", "routing", "services", "Angular CLI"],
      "Tailwind CSS": ["utility-first approach", "responsive design", "custom themes", "dark mode", "JIT engine", "arbitrary values", "plugin system", "container queries", "animations", "custom variants", "tailwind config", "optimization", "purge unused styles", "design system", "component extraction", "state variants", "breakpoints", "typography plugin", "forms plugin", "fluid typography"],
    }
  );
}

function generateBackendQuestions() {
  return generateCategory("Backend",
    ["Node.js", "Express", "FastAPI", "Django", "Spring Boot", "Laravel"],
    {
      "Node.js": ["event loop", "streams", "buffers", "cluster module", "worker threads", "child processes", "error handling", "middleware", "RESTful APIs", "JWT auth", "WebSockets", "file system", "package management", "module caching", "async patterns", "environment config", "debugging", "profiling", "security best practices", "testing with Jest"],
      "Express": ["middleware chain", "error handling", "routing", "template engines", "static files", "body parsing", "CORS", "rate limiting", "session management", "cookie parsing", "file upload", "request validation", "API versioning", "compression", "helmet security", "Express Router", "subdomain routing", "error recovery", "logging", "Express 5 features"],
      "FastAPI": ["path operations", "dependency injection", "Pydantic models", "async endpoints", "WebSocket", "background tasks", "OAuth2 JWT", "CORS", "testing", "OpenAPI docs", "response models", "exception handlers", "middleware", "file uploads", "database sessions", "Docker deployment", "WebSocket", "GraphQL", "security utilities", "performance optimization"],
      "Django": ["ORM", "class-based views", "middleware", "authentication", "signals", "management commands", "template inheritance", "DRF serializers", "view sets", "permissions", "throttling", "testing", "migrations", "admin customization", "caching", "Django Channels", "Celery tasks", "Django REST", "queryset optimization", "security middleware"],
      "Spring Boot": ["IoC container", "dependency injection", "AOP", "Spring Data JPA", "Spring Security", "REST controllers", "actuator endpoints", "transaction management", "bean scopes", "profiles", "WebFlux", "JUnit testing", "Spring Cloud", "message queues", "scheduled tasks", "exception handling", "validation", "Spring Boot 3", "Micrometer", "GraalVM native"],
      "Laravel": ["Eloquent ORM", "service container", "facades", "middleware", "artisan commands", "events and listeners", "queues", "jobs", "mail", "notifications", "caching", "migrations", "seeders", "factories", "policies", "gates", "form requests", "API resources", "Laravel Horizon", "Laravel Sanctum"],
    }
  );
}

function generateProgrammingQuestions() {
  return generateCategory("Programming",
    ["Python", "Java", "C++", "C#", "Go", "Rust"],
    {
      "Python": ["list comprehensions", "decorators", "generators", "context managers", "metaclasses", "GIL", "asyncio", "multiprocessing", "descriptors", "duck typing", "abstract base classes", "type hints", "dataclasses", "functools", "itertools", "collections module", "pathlib", "f-strings", "match case", "async generators"],
      "Java": ["Stream API", "Optional", "CompletableFuture", "method references", "functional interfaces", "lambda expressions", "thread safety", "synchronized", "volatile", "ConcurrentHashMap", "try-with-resources", "module system", "records", "sealed classes", "pattern matching", "garbage collection", "JVM memory", "reflection", "annotations", "JPMS"],
      "C++": ["RAII", "smart pointers", "move semantics", "template metaprogramming", "SFINAE", "variadic templates", "lambda expressions", "constexpr", "virtual inheritance", "polymorphism", "STL containers", "rvalue references", "exception safety", "placement new", "type traits", "C++20 modules", "concepts", "coroutines", "ranges library", "fold expressions"],
      "C#": ["LINQ", "async/await", "delegates", "events", "reflection", "attributes", "extension methods", "nullable reference types", "records", "pattern matching", "Span<T>", "dependency injection", "yield return", "Expression trees", "source generators", "top-level statements", "primary constructors", "C# 12 features", "interceptors", "collection expressions"],
      "Go": ["goroutines", "channels", "interface satisfaction", "defer", "error wrapping", "generics", "embedding", "context package", "sync.WaitGroup", "select statement", "iota constants", "slice internals", "map concurrency", "testing", "pprof profiling", "race detection", "Go modules", "workspaces", "templates", "embed package"],
      "Rust": ["ownership", "borrowing", "lifetimes", "trait bounds", "enums", "pattern matching", "Result vs Option", "unsafe code", "concurrency", "Send and Sync", "Arc vs Rc", "smart pointers", "macros", "async/await", "Pin and Unpin", "iterators", "closures", "associated types", "Cargo workspace", "Rust 2024 edition"],
    }
  );
}

function generateDatabaseQuestions() {
  return generateCategory("Database",
    ["SQL", "PostgreSQL", "MongoDB", "Redis"],
    {
      "SQL": ["JOIN types", "subqueries", "CTEs", "window functions", "indexing", "query optimization", "normalization", "transactions", "isolation levels", "stored procedures", "triggers", "full-text search", "recursive CTEs", "pivot tables", "execution plans", "locking", "views", "materialized views", "constraints", "data types"],
      "PostgreSQL": ["MVCC", "VACUUM", "autovacuum", "TOAST", "partial indexes", "GIN indexes", "GiST indexes", "JSONB", "table partitioning", "replication", "pg_stat_statements", "full-text search", "extensions", "foreign data wrappers", "LISTEN/NOTIFY", "range types", "upsert (ON CONFLICT)", "BRIN indexes", "logical replication", "parallel query"],
      "MongoDB": ["document model", "aggregation pipeline", "index types", "replica sets", "sharding", "change streams", "transactions", "2dsphere", "TTL indexes", "text indexes", "data modeling", "mongoose ODM", "read concern", "write concern", "B-tree indexes", "Atlas Search", "time series", "schema validation", "encryption", "MongoDB 8 features"],
      "Redis": ["data structures", "pipelining", "pub/sub", "Streams", "caching patterns", "Redlock", "persistence RDB vs AOF", "Redis Cluster", "sorted sets", "Lua scripting", "key expiration", "HyperLogLog", "Bloom filters", "geospatial", "Redis Sentinel", "Redis Stack", "RedisJSON", "RedisSearch", "RedisGraph", "rate limiting patterns"],
    }
  );
}

function generateCloudQuestions() {
  return generateCategory("Cloud",
    ["AWS", "Azure", "Docker", "Kubernetes"],
    {
      "AWS": ["EC2 vs Lambda", "S3 storage classes", "VPC networking", "RDS vs DynamoDB", "CloudFront CDN", "Route 53", "IAM policies", "ECS vs EKS", "CloudFormation", "ElastiCache", "SQS vs SNS", "API Gateway", "Step Functions", "CloudWatch", "WAF Shield", "Systems Manager", "CodePipeline", "RDS Aurora", "DynamoDB streams", "Lambda layers"],
      "Azure": ["Azure Functions", "App Service", "DevOps pipelines", "Azure SQL", "Blob Storage", "Virtual Networks", "Azure AD", "AKS vs ACI", "Cosmos DB", "Logic Apps", "Service Bus", "Traffic Manager", "Azure Monitor", "Key Vault", "Front Door", "Azure Policy", "Blueprints", "APIM", "Event Grid", "Azure Cognitive Services"],
      "Docker": ["container vs VM", "Dockerfile best practices", "multi-stage builds", "Docker Compose", "networking", "volumes", "Docker Swarm", "health checks", "security", "layer caching", "resource constraints", "logging drivers", "registry", "overlay network", "image optimization", "Docker Scout", "BuildKit", "Docker init", "compose watch", "rootless mode"],
      "Kubernetes": ["Pod lifecycle", "Deployment strategies", "Service types", "ConfigMap", "Secrets", "Persistent Volumes", "Ingress", "RBAC", "HPA", "StatefulSets", "DaemonSets", "Network Policies", "Helm charts", "CRDs", "operators", "Service Mesh", "Kustomize", "Pod security", "Vertical Pod Autoscaler", "Cluster API"],
    }
  );
}

function generateDevOpsQuestions() {
  const topics = [
    "CI/CD pipeline design", "Git branching strategies", "Infrastructure as Code", "configuration management",
    "monitoring and alerting", "log aggregation", "incident response", "SLOs SLIs SLAs",
    "blue-green deployment", "canary releases", "feature flags", "chaos engineering",
    "GitOps workflow", "secret management", "automated testing", "performance benchmarking",
    "capacity planning", "disaster recovery", "security scanning", "container orchestration",
    "Terraform state management", "Ansible playbooks", "Prometheus monitoring", "Grafana dashboards",
    "ELK stack logging", "SonarQube integration", "SAST vs DAST", "supply chain security",
    "cost optimization", "FinOps practices", "multi-cloud strategy", "service mesh observability",
  ];
  const questions = [];
  for (const t of topics) {
    for (let v = 0; v < 5; v++) {
      const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
      const diff = pick(["medium", "medium", "hard", "hard"]);
      questions.push(makeQuestion({
        question: `Explain ${t} with a real-world implementation example.`,
        answer: `${t} is a DevOps practice that involves ${["automating workflows", "improving reliability", "reducing deployment risk", "enhancing collaboration", "ensuring compliance"][randInt(0, 4)]}. Teams implement it using tools like ${["Jenkins/GitHub Actions", "Terraform/Ansible", "Prometheus/Grafana", "ArgoCD/Flux", "Vault/SOPS"][randInt(0, 4)]}.`,
        category: "DevOps", subcategory: "DevOps",
        difficulty: diff, companies,
        tags: ["devops", ...t.toLowerCase().split(" ").filter(w => w.length > 2)],
        timeEst: randInt(5, 20),
        role: pick(["DevOps Engineer", "SRE", "Platform Engineer", "Cloud Engineer"]),
        expLevel: pick(["mid", "senior", "senior", "lead"]),
      }));
    }
  }
  return questions;
}

function generateAIQuestions() {
  return generateCategory("AI",
    ["Machine Learning", "Deep Learning", "LLM", "RAG", "LangChain", "LangGraph", "MCP", "Prompt Engineering", "AI Agents", "Generative AI"],
    {
      "Machine Learning": ["supervised vs unsupervised", "bias-variance tradeoff", "cross-validation", "regularization", "feature engineering", "PCA", "decision trees", "random forests", "SVM kernels", "gradient descent", "confusion matrix", "ROC AUC curves", "ensemble methods", "imbalanced data", "outlier detection", "hyperparameter tuning", "model evaluation", "feature selection", "dimensionality reduction", "clustering algorithms"],
      "Deep Learning": ["neural networks", "backpropagation", "activation functions", "CNN vs RNN vs Transformer", "batch normalization", "dropout", "transfer learning", "LSTM vs GRU", "attention mechanism", "GANs", "VAE", "gradient vanishing", "learning rate scheduling", "weight initialization", "model quantization", "distillation", "mixture of experts", "position encoding", "layer normalization", "residual connections"],
      "LLM": ["transformer architecture", "attention mechanism", "pre-training objectives", "fine-tuning", "RLHF", "prompt engineering", "temperature sampling", "top-k sampling", "context window", "model quantization", "LoRA", "QLoRA", "instruction tuning", "chain-of-thought", "few-shot learning", "zero-shot learning", "hallucination", "tokenization", "positional encoding", "KV cache optimization"],
      "RAG": ["RAG architecture", "retrieval strategies", "chunking techniques", "embedding models", "vector databases", "hybrid search", "re-ranking", "context optimization", "query transformation", "RAG evaluation", "multi-hop RAG", "agentic RAG", "Graph RAG", "RAG vs fine-tuning", "production RAG", "late interaction", "fusion retrieval", "hierarchical retrieval", "query routing", "RAGAS metrics"],
      "LangChain": ["LCEL", "chains", "runnables", "tool definitions", "agent types", "memory systems", "document loaders", "text splitters", "vector store", "LLM wrappers", "callbacks", "tracing", "hub prompts", "output parsers", "LangServe", "LangSmith", "custom components", "streaming", "batch processing", "parallel execution"],
      "LangGraph": ["graph architecture", "state management", "nodes and edges", "conditional routing", "checkpointing", "persistence", "human-in-the-loop", "subgraphs", "parallel execution", "streaming", "error recovery", "tool calling", "multi-agent", "supervisor patterns", "execution optimization", "message history", "agent coordination", "breakpoints", "dynamic graph", "async execution"],
      "MCP": ["model context protocol", "tool definition", "resource exposure", "prompt templates", "transport layer", "security model", "capability negotiation", "error handling", "MCP vs function calling", "server implementation", "client integration", "discovery", "rate limiting", "authentication", "logging debugging", "stdio transport", "SSE transport", "MCP tools", "MCP resources", "MCP prompts"],
      "Prompt Engineering": ["zero-shot prompting", "few-shot prompting", "chain-of-thought", "tree-of-thought", "ReAct pattern", "system prompts", "role prompting", "negative prompting", "structured output", "prompt chaining", "dynamic prompting", "prompt optimization", "A/B testing", "prompt versioning", "injection prevention", "persona prompting", "step-back prompting", "self-consistency", "generated knowledge", "automatic prompt engineering"],
      "AI Agents": ["agent architecture", "tool use", "function calling", "planning", "reasoning", "memory management", "multi-agent", "agent evaluation", "reactive agents", "proactive agents", "agent safety", "observability", "orchestration", "task decomposition", "reflection loops", "error recovery", "agent-human collaboration", "deployment", "monitoring", "agent frameworks"],
      "Generative AI": ["diffusion models", "autoregressive generation", "controlled generation", "guidance techniques", "multimodal generation", "text-to-image", "text-to-speech", "code generation", "ethical AI", "model evaluation", "human feedback", "safety filtering", "content moderation", "responsible AI", "RLHF", "DPO", "preference optimization", "alignment", "steerability", "personalization"],
    }
  );
}

function generateSystemDesignQuestions() {
  const designs = [
    "YouTube", "Netflix", "WhatsApp", "Messenger", "Uber", "Lyft",
    "Twitter", "Instagram", "Amazon", "eBay", "Dropbox", "Google Drive",
    "Slack", "Discord", "Zoom", "Google Maps", "Airbnb", "Ticketmaster",
    "PayPal", "Stripe", "Pinterest", "Reddit", "Spotify", "Tinder",
    "LinkedIn", "Quora", "Medium", "Notion", "Figma", "GitHub",
  ];
  const concepts = [
    { t: "Scalability patterns", sd: "Horizontal vs vertical scaling, sharding, partitioning" },
    { t: "Load Balancing strategies", sd: "Round robin, least connections, consistent hashing" },
    { t: "Caching strategies", sd: "CDN, Redis, Memcached, cache-aside, write-through" },
    { t: "Microservices architecture", sd: "Service decomposition, communication patterns, saga pattern" },
    { t: "Message queues", sd: "Kafka, RabbitMQ, SQS, pub/sub, event sourcing" },
    { t: "CAP Theorem", sd: "Consistency, availability, partition tolerance trade-offs" },
    { t: "Database sharding", sd: "Horizontal partitioning, shard keys, rebalancing" },
    { t: "Consistent Hashing", sd: "Distributed data distribution, ring topology" },
    { t: "Distributed transactions", sd: "Two-phase commit, saga pattern, eventual consistency" },
    { t: "Rate limiting", sd: "Token bucket, leaky bucket, sliding window" },
    { t: "API design principles", sd: "REST, GraphQL, gRPC, versioning, pagination" },
    { t: "Observability", sd: "Logging, metrics, tracing, alerting" },
    { t: "Data replication", sd: "Leader-follower, multi-leader, quorum" },
    { t: "Consensus algorithms", sd: "Paxos, Raft, Zab, gossip protocol" },
    { t: "Content Delivery Networks", sd: "Edge caching, CDN architecture, origin shielding" },
    { t: "Search architecture", sd: "Inverted index, full-text search, Elasticsearch" },
    { t: "Data lakes vs warehouses", sd: "Schema-on-read vs schema-on-write, ETL vs ELT" },
    { t: "Stream processing", sd: "Kafka Streams, Flink, Spark Streaming" },
    { t: "Blob storage", sd: "S3, GCS, Azure Blob, object storage" },
    { t: "Time series databases", sd: "InfluxDB, TimescaleDB, Prometheus" },
    { t: "Graph databases", sd: "Neo4j, Dgraph, Amazon Neptune" },
    { t: "Event sourcing", sd: "CQRS, event store, projection" },
    { t: "Circuit breaker pattern", sd: "Resilience, bulkhead, retry, timeout" },
    { t: "Service mesh", sd: "Istio, Linkerd, sidecar proxy, mTLS" },
    { t: "Blob storage systems", sd: "S3, GCS, Azure Blob, object storage architecture" },
    { t: "Distributed file systems", sd: "HDFS, GlusterFS, Ceph" },
    { t: "Container orchestration", sd: "Kubernetes, Docker Swarm, Mesos" },
    { t: "Serverless architecture", sd: "FaaS, cold starts, Lambda, Cloud Functions" },
    { t: "Edge computing", sd: "CDN edge, IoT, CloudFront Edge Functions" },
    { t: "Multi-region deployment", sd: "Active-active, active-passive, geo-routing" },
    { t: "WebSocket architecture", sd: "Connection management, scaling, fallback" },
    { t: "Real-time analytics", sd: "Lambda architecture, Kappa architecture" },
    { t: "Data pipeline design", sd: "Batch vs streaming, ETL, data quality" },
    { t: "Identity and access management", sd: "OAuth2, OIDC, SAML, RBAC" },
    { t: "Compliance and security", sd: "GDPR, SOC2, encryption, audit logging" },
  ];

  const questions = [];
  for (const d of designs) {
    for (let v = 0; v < 3; v++) {
      const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
      const diff = pick(["medium", "hard", "hard"]);
      questions.push(makeQuestion({
        question: `Design ${d}: Design a scalable architecture for ${d}-like system.`,
        answer: `To design ${d}, we need to consider scalability, availability, and latency. Key components include load balancers, application servers, and databases. The system should handle millions of DAUs. We use ${["event-driven architecture", "microservices", "CQRS", "lambda architecture"][randInt(0, 3)]} with ${["Kafka", "Redis", "PostgreSQL", "Cassandra"][randInt(0, 3)]} for ${["scalability", "caching", "persistence", "messaging"][randInt(0, 3)]}.`,
        category: "System Design", subcategory: "Architecture Design",
        difficulty: diff, companies,
        tags: ["system-design", "architecture", d.toLowerCase()],
        timeEst: randInt(30, 60),
        role: pick(["Software Engineer", "Senior Engineer", "Staff Engineer", "Solutions Architect"]),
        expLevel: pick(["senior", "senior", "lead"]),
      }));
    }
  }
  for (const { t, sd } of concepts) {
    for (let v = 0; v < 3; v++) {
      const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
      const diff = pick(["medium", "hard", "hard"]);
      questions.push(makeQuestion({
        question: `Explain ${t} in system design.`,
        answer: `${t} is a system design concept involving ${sd}. The key trade-offs include cost vs performance, consistency vs availability, and complexity vs scalability. Choose the right approach based on your requirements.`,
        category: "System Design", subcategory: "Design Concepts",
        difficulty: diff, companies,
        tags: ["system-design", ...t.toLowerCase().split(" ").filter(w => w.length > 2)],
        timeEst: randInt(10, 25),
        role: pick(["Software Engineer", "Senior Engineer", "Staff Engineer", "Solutions Architect"]),
        expLevel: pick(["mid", "senior", "senior", "lead"]),
      }));
    }
  }
  return questions;
}

function generateDSAQuestions() {
  const dsaTopics = {
    "Arrays": ["two-pointer technique", "sliding window", "prefix sum", "Dutch national flag", "Kadane's algorithm", "rotate array", "merge sorted arrays", "find duplicates", "subarray sum", "next permutation", "majority element", "container with most water", "trapping rain water", "first missing positive", "product of array except self", "spiral matrix", "set matrix zeroes", "subarray with given XOR", "max subarray sum", "longest consecutive sequence"],
    "Linked Lists": ["reverse linked list", "detect cycle", "merge sorted lists", "find middle", "LRU cache", "remove nth node", "palindrome check", "intersection", "flatten multilevel", "copy random pointer", "rotate linked list", "add two numbers", "odd even list", "swap nodes pairs", "merge k lists", "sort linked list", "reorder list", "split linked list", "deep copy", "doubly linked list"],
    "Trees": ["tree traversals", "LCA binary tree", "diameter of tree", "validate BST", "level order", "serialize deserialize", "construct from traversals", "max path sum", "balanced tree", "right side view", "zigzag traversal", "building BST", "kth smallest BST", "invert tree", "symmetic tree", "subtree check", "boundary traversal", "populate next pointers", "flatten tree", "max width"],
    "Graphs": ["BFS", "DFS", "Dijkstra's algorithm", "topological sort", "cycle detection", "union-find DSU", "minimum spanning tree", "graph coloring", "strongly connected components", "clone graph", "network delay time", "alien dictionary", "course schedule", "word ladder", "number of islands", "rotting oranges", "cheapest flights", "evaluate division", "Pacific Atlantic flow", "graph bipartite"],
    "Dynamic Programming": ["0/1 knapsack", "LCS", "LIS", "edit distance", "coin change", "matrix chain", "palindromic subsequence", "DP on grids", "house robber", "egg dropping", "rod cutting", "subset sum", "partition equal sum", "wildcard matching", "regular expression", "burst balloons", "best time to trade", "max square", "minimum path sum", "unique paths"],
    "Greedy": ["activity selection", "job sequencing", "Huffman coding", "fractional knapsack", "minimum platforms", "jump game", "gas station", "interval scheduling", "task scheduler", "candy distribution", "non-overlapping intervals", "minimum arrows", "remove k digits", "queue reconstruction", "partition labels", "IPO capital", "furthest building", "hand straights", "car fleet", "minimize deviation"],
    "Backtracking": ["N-Queens", "sudoku solver", "subset sum", "permutations", "combination sum", "generate parentheses", "word search", "rat in maze", "knight tour", "graph coloring", "letter combinations", "palindrome partitioning", "unique paths III", "word squares", "remove invalid parens", "matchsticks square", "tug of war", "m coloring", "Hamiltonian cycle", "crossword puzzle"],
  };

  const questions = [];
  for (const [cat, topics] of Object.entries(dsaTopics)) {
    for (const t of topics) {
      for (let v = 0; v < 3; v++) {
        const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
        const diff = pick(["easy", "medium", "medium", "hard", "hard"]);
        questions.push(makeQuestion({
          question: `Solve: ${t} — Explain the approach, complexity, and provide a solution.`,
          answer: `The ${t} problem can be solved using ${diff === "easy" ? "a straightforward" : diff === "medium" ? "an optimized" : "an advanced"} approach.\nAlgorithm:\n1. ${["Initialize data structures", "Handle edge cases", "Iterate input", "Apply core logic", "Return result"][randInt(0, 4)]}\n2. ${["Process each element", "Update state", "Check conditions", "Maintain invariants", "Optimize"][randInt(0, 4)]}\n3. ${["Return computed result", "Verify correctness"][randInt(0, 1)]}\n\nTime: O(${pick(["n", "n log n", "n²", "2ⁿ", "n!", "n × m"])})\nSpace: O(${pick(["1", "n", "n²", "log n"])})`,
          category: "DSA", subcategory: cat,
          difficulty: diff, companies,
          tags: ["dsa", cat.toLowerCase(), ...t.toLowerCase().split(" ").filter(w => w.length > 2)],
          timeEst: diff === "easy" ? randInt(10, 20) : diff === "medium" ? randInt(20, 35) : randInt(30, 60),
          role: pick(["SDE", "Software Engineer", "Backend Engineer", "Competitive Programmer"]),
          expLevel: pick(["entry", "junior", "mid", "mid", "senior"]),
        }));
      }
    }
  }
  return questions;
}

function generateHRQuestions() {
  const hrQuestions = [
    "Tell me about yourself.",
    "What are your greatest strengths?",
    "What are your biggest weaknesses?",
    "Why do you want to work here?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "Describe a challenging situation and how you handled it.",
    "Tell me about a time you showed leadership.",
    "Describe a conflict you resolved at work.",
    "How do you handle pressure or stressful situations?",
    "What is your ideal work environment?",
    "How do you prioritize your work?",
    "Describe a time you failed and what you learned.",
    "Tell me about a time you worked in a team.",
    "How do you deal with criticism?",
    "What are your salary expectations?",
    "Why are you leaving your current job?",
    "What do you know about our company?",
    "Describe your ideal manager.",
    "How do you stay updated with industry trends?",
    "Tell me about a project you're proud of.",
    "How do you handle multiple deadlines?",
    "Describe a time you went above and beyond.",
    "What motivates you?",
    "How do you adapt to change?",
    "Tell me about a time you mentored someone.",
    "What would your colleagues say about you?",
    "How do you make difficult decisions?",
    "Describe your communication style.",
    "What skills do you want to develop?",
    "Tell me about a time you had to persuade someone.",
    "How do you handle ambiguity?",
    "What would you do in your first 30 days?",
    "Describe your ideal company culture.",
    "How do you celebrate successes?",
    "Tell me about a time you received constructive feedback.",
    "What technology are you most excited about?",
    "How do you contribute to team culture?",
    "Describe a data-driven decision you made.",
    "What would you do if you disagreed with a decision?",
    "Tell me about a time you had to learn something quickly.",
    "How do you set goals for yourself?",
    "Describe your process for solving a complex problem.",
    "What does work-life balance mean to you?",
    "How do you build relationships with colleagues?",
    "Tell me about a time you innovated at work.",
    "What are you passionate about outside of work?",
    "How do you approach diversity and inclusion?",
    "Describe a time you presented to executives.",
    "What questions do you have for me?",
    "Why is there a gap in your employment?",
    "How do you stay productive while working remotely?",
    "Describe your experience with cross-functional teams.",
    "How do you handle an underperforming team member?",
    "Tell me about a time you had to push back on a requirement.",
    "Describe your experience with agile methodologies.",
    "How do you handle a project with changing requirements?",
    "Tell me about a time you had to compromise.",
    "How do you ensure quality in your work?",
    "Describe a time you identified a process improvement.",
    "How do you deal with difficult stakeholders?",
    "What is your approach to risk management?",
    "Tell me about a time you managed a budget.",
    "How do you handle success and recognition?",
    "Describe your experience with hiring and interviewing.",
    "What leadership philosophy do you follow?",
  ];

  const categories = ["Introduction", "Self-Assessment", "Motivation", "Leadership", "Conflict Resolution", "Teamwork", "Problem Solving", "Career Goals", "Communication", "Culture Fit"];

  const questions = [];
  for (const q of hrQuestions) {
    for (let v = 0; v < 3; v++) {
      const cat = pick(categories);
      const companies = pickMany(ALL_COMPANIES, randInt(1, 5));
      questions.push(makeQuestion({
        question: q,
        answer: `When answering "${q}", use the ${pick(["STAR method (Situation, Task, Action, Result)", "PAR method (Problem, Action, Result)", "CAR method (Context, Action, Result)"])} method. ${pick(["Structure your answer clearly with specific examples.", "Be honest while highlighting your strengths.", "Focus on outcomes and what you learned.", "Connect your answer to the role and company values."])}`,
        category: "HR", subcategory: cat,
        difficulty: pick(["easy", "medium"]),
        companies,
        tags: ["hr", "behavioral", cat.toLowerCase()],
        timeEst: randInt(2, 5),
        role: pick(["Any Role", "Software Engineer", "Manager", "Individual Contributor"]),
        expLevel: pick(["entry", "junior", "mid", "senior", "lead"]),
        explanation: `This is a common HR interview question that assesses your ${cat.toLowerCase()} skills and cultural fit.`,
      }));
    }
  }
  return questions;
}

export async function seedInterviewQuestions() {
  try {
    const existingCount = await InterviewQuestion.countDocuments({ isPublished: true });
    if (existingCount >= 1000) {
      console.log(`✓ ${existingCount} interview questions already exist — skipping seed`);
      return;
    }

    console.log("🌱 Seeding interview questions...");

    const generators = [
      { name: "Frontend", fn: generateFrontendQuestions },
      { name: "Backend", fn: generateBackendQuestions },
      { name: "Programming", fn: generateProgrammingQuestions },
      { name: "Database", fn: generateDatabaseQuestions },
      { name: "Cloud", fn: generateCloudQuestions },
      { name: "DevOps", fn: generateDevOpsQuestions },
      { name: "AI", fn: generateAIQuestions },
      { name: "System Design", fn: generateSystemDesignQuestions },
      { name: "DSA", fn: generateDSAQuestions },
      { name: "HR", fn: generateHRQuestions },
    ];

    let allQuestions = [];
    for (const { name, fn } of generators) {
      try {
        const qs = fn();
        allQuestions = allQuestions.concat(qs);
        console.log(`  ✓ ${name}: ${qs.length} questions generated`);
      } catch (err) {
        console.error(`  ✗ ${fn.name}: ${err.message}`);
      }
    }

    if (allQuestions.length === 0) {
      console.log("  ⚠ No questions generated");
      return;
    }

    await InterviewQuestion.insertMany(allQuestions, { ordered: false });
    console.log(`  ✓ ${allQuestions.length} interview questions seeded successfully`);
  } catch (error) {
    console.error("✗ Failed to seed interview questions:", error.message);
  }
}
