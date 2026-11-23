// N3xUs Konc3pt'z studio content — the single source of truth for the
// merged site's marketing pages. Ported from the studio site
// (nexcon-psi.vercel.app) on 2026-11-23. Prices are the catalog prices as
// shown on the studio site's services index + detail pages.
//
// PRICE (resolved by Juan, 2026-11-23): the landing page is $150, final.
// All catalog prices are final prices, not "starting at". The old site
// disagreed with itself ($175 on the services pages, $250 in the pipeline /
// FAQ / older catalog); $150 supersedes both.

export const STUDIO = {
  name: "N3xUs Konc3pt'z",
  founder: "Juan Socarras",
  role: "Founder & Principal",
  location: "South Texas",
  email: "studio@n3xuskonc3ptz.com",
  discord: "https://discord.gg/3UHWMa7rC",
  telegram: "https://t.me/n3xusg",
  telegramHandle: "@n3xusg",
  hours: "Mon–Fri 09:00–18:00",
  timezone: "America/Chicago",
  firstResponse: "24h on weekdays",
  rating: "5.0/5 (2 reviews)",
  priceRange: "$$",
  tagline: "Design. Development. Deployment.",
  metaDescription:
    "South Texas digital studio for custom websites, apps, Discord and Telegram bots, SEO, and managed hosting. Design, development, and deployment from one desk.",
};

export type ServiceGroup = "Build" | "Automate" | "Host" | "Amplify";

export type Service = {
  slug: string;
  name: string;
  group: ServiceGroup;
  price: string;
  pitch: string;
  deliverables: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "web-development",
    name: "Web Development",
    group: "Build",
    price: "$1,250",
    pitch:
      "Full-stack engineering for products that have to ship, scale, and stay maintainable. React and Node on the surface; Postgres, auth, and APIs underneath. We design the architecture before we write the first route.",
    deliverables: [
      "Full-stack application architecture",
      "API integration and custom endpoints",
      "Database modeling and migrations",
      "Auth, roles, and session handling",
      "Performance budgets and Core Web Vitals",
      "Handoff docs and deployment runbook",
    ],
  },
  {
    slug: "web-design",
    name: "Web Design",
    group: "Build",
    price: "$750",
    pitch:
      "Interface design with the restraint of print and the precision of product. We start with type, surface, and a single accent — then build pages that convert without looking like every other agency site.",
    deliverables: [
      "UI/UX for marketing or product surfaces",
      "Wireframes through high-fidelity screens",
      "Brand integration and type pairing",
      "Component inventory for engineering",
      "Mobile-first layouts",
      "Motion spec (subtle, interruptible)",
    ],
  },
  {
    slug: "responsive-web-design",
    name: "Responsive Web Design",
    group: "Build",
    price: "$500",
    pitch:
      "Reflow, not shrink. We rebuild layouts so type, hit targets, and media behave at 390px first, then up. Cross-browser checks included — Safari, Chrome, Firefox.",
    deliverables: [
      "Mobile-first layout pass",
      "Fluid type and spacing",
      "Cross-browser testing",
      "Touch target audit (44px)",
      "Overflow and orientation fixes",
      "Image and media srcset strategy",
    ],
  },
  {
    slug: "landing-page",
    name: "Landing Page",
    group: "Build",
    price: "$150",
    pitch:
      "A single, tightly written surface with a clear offer, proof, and a form that actually submits. Copy, layout, and tracking in one pass — no carousel of distractions.",
    deliverables: [
      "Offer architecture and copy",
      "Lead capture form",
      "A/B-ready section structure",
      "Analytics and conversion events",
      "Fast load, no junk scripts",
      "Mobile-first layout",
    ],
  },
  {
    slug: "website-work",
    name: "Website Work",
    group: "Build",
    price: "$100",
    pitch:
      "A scoped block of engineering time for sites that are already live. Security updates, content swaps, speed work, or the thing you've been ignoring. Unused time does not roll — we use the three hours.",
    deliverables: [
      "Security and dependency updates",
      "Content and layout edits",
      "Performance passes",
      "Bug isolation and fix",
      "Backup before we touch production",
      "Written summary of what changed",
    ],
  },
  {
    slug: "api-development",
    name: "API Development",
    group: "Build",
    price: "$200",
    pitch:
      "Contracts first: resources, auth, rate limits, errors. Then implementation with tests and docs so the next engineer — including future-you — does not have to reverse-engineer a black box.",
    deliverables: [
      "REST or GraphQL design",
      "Token and session authentication",
      "Rate limiting and abuse controls",
      "Versioning strategy",
      "OpenAPI or schema docs",
      "Staging environment",
    ],
  },
  {
    slug: "discord-bots",
    name: "Custom Discord Bots",
    group: "Automate",
    price: "$99",
    pitch:
      "A bot is a product. We spec commands, permissions, and failure modes, then ship Discord.js with a real database. Optional AI for support or onboarding. Hosting is separate if you want us to run it.",
    deliverables: [
      "Slash commands and permissions",
      "Moderation and logging",
      "Economy / XP systems",
      "Music or media queues",
      "AI integration where it earns its keep",
      "Admin dashboard or config channel",
    ],
  },
  {
    slug: "telegram-bots",
    name: "Custom Telegram Bots",
    group: "Automate",
    price: "$99",
    pitch:
      "Telegram is where a lot of communities and shops actually live. We build bots that manage groups, take payments, and talk to your other systems — without the 3 a.m. 'bot is down' message.",
    deliverables: [
      "Group management and anti-spam",
      "Automated replies and menus",
      "Payment gateway hooks",
      "API integration",
      "Broadcast and digest jobs",
      "Logging and admin commands",
    ],
  },
  {
    slug: "premium-managed-bot-hosting",
    name: "Managed Bot Hosting",
    group: "Host",
    price: "$9.99/mo",
    pitch:
      "Bots are not websites. They need a persistent socket, isolated RAM, and a process supervisor that comes back up without you. We run Discord and Telegram workloads on dedicated resources with token-safe config and daily state backups.",
    deliverables: [
      "Isolated CPU and memory",
      "Low-latency process placement",
      "Automatic restart on crash",
      "Encrypted token storage",
      "Daily state / database snapshots",
      "Uptime watch and incident notes",
    ],
  },
  {
    slug: "premium-managed-cloud-hosting",
    name: "Managed Cloud Hosting",
    group: "Host",
    price: "$19.99/mo",
    pitch:
      "We take the box, the TLS, the backups, and the updates. Global CDN in front, daily snapshots behind, firewall and patch cadence in between. Built for the sites and apps we design — or for ones you already have.",
    deliverables: [
      "CDN and aggressive cache policy",
      "TLS, firewall, and patch cadence",
      "Daily snapshots with rollback",
      "Uptime monitoring",
      "Core updates and performance tuning",
      "Incident response during business hours+",
    ],
  },
  {
    slug: "seo",
    name: "Search Engine Optimization",
    group: "Amplify",
    price: "$300",
    pitch:
      "Crawl health, titles, internals, and a keyword map tied to pages you can ship. We do not sell a thousand backlinks. We make the site make sense to Google and to the person who lands.",
    deliverables: [
      "Keyword and intent map",
      "On-page titles, metas, headings",
      "Internal linking and IA",
      "Technical crawl fixes",
      "Schema where it is honest",
      "90-day measurement plan",
    ],
  },
  {
    slug: "internet-marketing",
    name: "Internet Marketing",
    group: "Amplify",
    price: "$250",
    pitch:
      "Strategy, creative, and tracking in one loop. PPC, landing alignment, and conversion events so you can see what the spend did — not a vanity dashboard.",
    deliverables: [
      "Campaign strategy",
      "PPC setup and structure",
      "Creative and offer alignment",
      "Conversion tracking",
      "Weekly pulse notes",
      "Kill / scale rules",
    ],
  },
  {
    slug: "social-media-marketing",
    name: "Social Media Marketing",
    group: "Amplify",
    price: "$250",
    pitch:
      "We pick the two surfaces that matter, write a month of posts, and set the measurement. Discord and Telegram-native if that is where your people are — not a generic grid.",
    deliverables: [
      "Channel and cadence plan",
      "30-day content set",
      "Community playbook",
      "Profile and bio pass",
      "UTM and tracking",
      "Handoff calendar",
    ],
  },
  {
    slug: "photography-videography",
    name: "Photography & Videography",
    group: "Amplify",
    price: "$400",
    pitch:
      "Product, space, and team coverage with a post pipeline. We shoot for the layouts we already designed so crops, contrast, and color actually fit.",
    deliverables: [
      "Product or space stills",
      "Short-form brand video",
      "Color and retouch",
      "Web-sized exports",
      "Usage-cleared files",
      "Optional on-site direction",
    ],
  },
];

export const SERVICE_GROUPS: { name: ServiceGroup; blurb: string }[] = [
  { name: "Build", blurb: "Sites, apps, and APIs — the thing itself." },
  { name: "Automate", blurb: "Bots that do the repetitive jobs." },
  { name: "Host", blurb: "We run it, patch it, and watch it." },
  { name: "Amplify", blurb: "Get found, get read, get the lead." },
];

export type Work = {
  slug: string;
  title: string;
  type: string;
  client: string;
  year: string;
  duration: string;
  stack: string;
  image: string;
  summary: string;
  problem: string;
  approach: string;
  outcome: string;
};

export const WORK: Work[] = [
  {
    slug: "elite-crete-systems-south-tx-web-platform",
    title: "Elite Crete Systems South Texas",
    type: "Web Systems",
    client: "Elite Crete Systems — Texas South",
    year: "2025",
    duration: "6 weeks",
    stack: "React / Node.js / Express",
    image: "/images/work-crete.jpg",
    summary:
      "A contractor-facing web platform for high-performance flooring in South Texas — specs, locales, and a path from inquiry to job.",
    problem:
      "Decorative and industrial flooring is sold on trust and samples, but the digital presence was a brochure that did not help a GC or property owner take the next step. Specs were scattered. Contact dropped into a void.",
    approach:
      "We rebuilt the surface as a working platform: systems and use-cases (kitchens, hangars, showrooms) as first-class routes, a cleaner inquiry flow, and a stack a local operator can actually update. Dark, material-led photography instead of clipart concrete.",
    outcome:
      "A site that reads like the product — dense, engineered, specific. Inquiries route with context (use-case, location, timeline) instead of a blank form.",
  },
  {
    slug: "nexus-moderation-bot",
    title: "Nexus Moderation & Economy",
    type: "Bots Systems",
    client: "N3xUs Studio",
    year: "2025",
    duration: "Ongoing product",
    stack: "Discord.js / PostgreSQL / Node API",
    image: "/images/work-host.jpg",
    summary:
      "A Discord bot that does two jobs well: keep the room clean, and give the economy enough depth that people stay.",
    problem:
      "Most public bots are a pile of commands with no memory. Communities outgrow them the moment they need custom roles, ledgers, or moderation that understands their rules.",
    approach:
      "Postgres for the ledger and cases. Slash commands with real permission trees. Moderation that logs, expires, and can be appealed. Economy with sinks so inflation does not eat the server in a month.",
    outcome:
      "The studio's reference bot — the same skeleton we fork for client servers. Deployed as a product, not a weekend script.",
  },
  {
    slug: "wicked-smokes",
    title: "Wicked Smokes",
    type: "Web Brand",
    client: "Wicked Smokes",
    year: "2026",
    duration: "3 weeks",
    stack: "React 19 / TypeScript",
    image: "/images/work-smokes.jpg",
    summary:
      "A retail surface for a smoke shop that needed to feel adult — dark glass, steel, no neon carnival.",
    problem:
      "The category defaults to loud. The shop wanted a presence that looked like the counter: matte, specific, easy to scan on a phone between errands.",
    approach:
      "React 19 storefront with a tight catalog, location/hours, and a visual system sampled from the actual fixtures. Type and contrast first; decoration last.",
    outcome:
      "A site that matches the room. Catalog and visit info without the template smell.",
  },
  {
    slug: "zenith-automation",
    title: "Zenith Automation",
    type: "Systems Web",
    client: "—",
    year: "2025",
    duration: "—",
    stack: "Node.js / REST / Workers",
    image: "/images/work-zenith.jpg",
    summary:
      "An operations layer for teams drowning in copy-paste between tools.",
    problem:
      "Quotes, follow-ups, and status lived in three chats and a spreadsheet. Nothing had a source of truth.",
    approach:
      "A small API and worker set that watches the tools they already use, then writes a single timeline. No new 'platform' to log into unless they want it.",
    outcome:
      "Handoffs stopped falling on the floor. The dashboard is a byproduct — the jobs are the product.",
  },
  {
    slug: "crypto-pulse",
    title: "Crypto Pulse",
    type: "Web Systems",
    client: "Studio R&D",
    year: "2025",
    duration: "R&D sprint",
    stack: "React / WebSockets / Node",
    image: "/images/work-pulse.jpg",
    summary:
      "A market pulse board: few numbers, honest latency, no casino chrome.",
    problem:
      "Crypto UIs scream. We wanted a terminal that a tired operator could read.",
    approach:
      "Live ticks over a socket, tabular figures, muted status. No token logos as decoration. Alerts as a list, not confetti.",
    outcome:
      "An internal board we still use when we need a read, and a pattern we reuse for any live ops surface.",
  },
  {
    slug: "galactic-nights",
    title: "Galactic Nights",
    type: "Web Brand",
    client: "Galactic Nights",
    year: "2025",
    duration: "2 weeks",
    stack: "React / CMS",
    image: "/images/work-nights.jpg",
    summary:
      "Event identity and a night-of site: lineup, tickets, where to stand.",
    problem:
      "The night had a name. The internet had a Facebook event and a JPEG.",
    approach:
      "A single scrolling night: type as the identity, a quiet city photograph, ticket and lineup as the only jobs of the page.",
    outcome:
      "Something you can send in a text that still looks like a poster when it opens.",
  },
  {
    slug: "neon-galactic-nights",
    title: "Neon Galactic Nights",
    type: "Web Brand",
    client: "Galactic Nights",
    year: "2026",
    duration: "3 weeks",
    stack: "React / Motion",
    image: "/images/work-neon-nights.jpg",
    summary:
      "The follow-up season: a tighter identity system and a page that can host a series, not one date.",
    problem:
      "One-off event pages rot. The series needed a home that could take the next date without a rebuild.",
    approach:
      "A season wrapper, archived nights, and a motion language that stays in the type — no particle soup.",
    outcome:
      "A living series page. Adding a date is content, not a project.",
  },
  {
    slug: "n3xus-konc3pt-z",
    title: "N3xUs Konc3pt'z",
    type: "Web Brand Systems",
    client: "This studio",
    year: "2026",
    duration: "Rebuild",
    stack: "React 19 / TanStack Start / TypeScript",
    image: "/images/hero-studio.jpg",
    summary:
      "The house site. Rebuilt from a zero-stat template into a working studio operating system.",
    problem:
      "The previous site claimed a cyberpunk aesthetic and then published 0 projects, 0 bots, and 0% satisfaction. Inner pages were thin. Copy repeated itself. Emoji stood in for a design system.",
    approach:
      "A real content model, honest work, a brief builder, a store, and a support desk. Dark, typographic, no neon. The 3 D's stay — the execution changes.",
    outcome:
      "The site you are on. Use it as the proof.",
  },
];

export type StoreProduct = {
  slug: string;
  name: string;
  priceCents: number;
  stack: string;
  summary: string;
  includes: string[];
};

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    slug: "advanced-discord-economy-bot-template",
    name: "Discord Economy Bot Template",
    priceCents: 4999,
    stack: "Discord.js · PostgreSQL · Node",
    summary:
      "The same Postgres-backed pattern we use on client servers, stripped of private branding. Slash commands, a currency with sinks, inventory, and a moderation-safe admin surface. You bring the token and the rules.",
    includes: [
      "Discord.js source",
      "Postgres schema + seed",
      "Economy, shop, and job modules",
      "Admin commands and config",
      "Deploy notes for a VPS or our hosting",
    ],
  },
  {
    slug: "cyberpunk-ui-component-kit-react",
    name: "Terminal UI Kit — React",
    priceCents: 2999,
    stack: "React · Tailwind · TypeScript",
    summary:
      "The component language of this studio, packaged. IBM Plex, hairline borders, concentric radii, signal green used once. Buttons, inputs, tabs, data rows, and a command palette shell.",
    includes: [
      "React + Tailwind v4 components",
      "Token file (CSS @theme)",
      "Command palette pattern",
      "Example dashboard page",
      "Usage notes",
    ],
  },
  {
    slug: "telegram-auto-responder-script",
    name: "Telegram Auto-Responder",
    priceCents: 1999,
    stack: "Node · Telegram Bot API",
    summary:
      "A focused script for shops and community desks that need a reliable first reply, a button menu, and a path to a human. Logging included. Extend it or leave it alone.",
    includes: [
      "Bot script + env sample",
      "Menu and hours config",
      "Handoff to a human chat",
      "Basic rate limiting",
      "Run instructions",
    ],
  },
  {
    slug: "n3xus-premium-dark-mode-css-theme",
    name: "N3xUs Dark CSS Theme",
    priceCents: 999,
    stack: "CSS",
    summary:
      "A CSS-only theme for sites that need to go dark without a redesign. Near-black, bone type, sage signal. Works as a starting layer on top of a classless or lightly classed document.",
    includes: [
      "theme.css with tokens",
      "Optional grain overlay",
      "Form and table styles",
      "Reduced-motion guards",
    ],
  },
];

export type JournalPost = {
  slug: string;
  title: string;
  date: string;
  readMin: number;
  category: string;
  dek: string;
  image: string;
  body: string[];
};

export const JOURNAL: JournalPost[] = [
  {
    slug: "rise-of-agentic-coding-ai-software-development",
    title: "Agentic coding is not a junior hire",
    date: "2026-06-21",
    readMin: 6,
    category: "AI / Engineering",
    dek: "An agent can stand up a route before lunch. That is not the same as shipping a product someone will pay for.",
    image: "/images/hero-studio.jpg",
    body: [
      "In 2026, an agent can stand up a route, a schema, and a plausible UI before lunch. That is not the same as shipping a product someone will pay for. The studio that treats the agent as a junior who never sleeps, and themselves as the staff engineer, is the one that gets faster without getting sloppy.",
      "We use agents the way we used to use Stack Overflow and snippets: to collapse boilerplate. We do not let them name the product, pick the type, or invent a third database 'just in case.'",
      "What actually changed: The cost of a first implementation dropped. The cost of a wrong abstraction did not. If anything it went up, because you can now generate a wrong abstraction at terrifying speed.",
      "Review is the skill. Spec is the skill. Knowing when a generated test is asserting the mock, not the behavior — that is the skill.",
      "How we work with it: Briefs still start on paper. Agents get a bounded task with a definition of done. Humans take the merge. If you want a studio that presses generate and invoices, there are plenty. We are not that.",
    ],
  },
  {
    slug: "build-custom-discord-bot-nodejs-2026",
    title: "Building a Discord bot in 2026, without the folklore",
    date: "2026-06-17",
    readMin: 8,
    category: "Discord / Node.js",
    dek: "Slash commands, intents you can explain, and state that is not a JSON file on a hobby VPS.",
    image: "/images/work-zenith.jpg",
    body: [
      "Discord is no longer a gamer VoIP with a bot graveyard. DAOs, shops, and support desks run on it. The engineering bar went up: slash commands, intents you can explain, and state that is not a JSON file on a hobby VPS.",
      "The stack we actually use: Node, Discord.js, Postgres. Commands as data. Permissions as a tree, not a boolean. Secrets in the environment, never in the repo. A process manager that restarts on a thrown promise.",
      "Hosting is a different product from the bot. A sleeping free dyno is not an architecture.",
      "Ship it: Containerize. Healthcheck the websocket. Log to something you will read. If you do not want to run that, that is what managed bot hosting is for — including ours.",
    ],
  },
  {
    slug: "custom-web-design-vs-templates-conversion",
    title: "Templates convert until they don't",
    date: "2026-05-12",
    readMin: 5,
    category: "Design / Conversion",
    dek: "A template teaches the visitor you are interchangeable — because they have already seen your hero.",
    image: "/images/studio-desk.jpg",
    body: [
      "Templates are honest tools. They get a plumber on the internet by Friday. They also teach the visitor that you are interchangeable, because they have already seen your hero, your three-column features, and your fake 4.9 stars.",
      "Conversion is not a button color. It is whether the page sounds like the business. Custom design is expensive relative to a theme and cheap relative to a year of looking like everyone else.",
      "When a template is correct: Validating an offer. A two-week landing test. An internal tool nobody outside the shop will see. We will say so.",
      "When the brand is the product — a shop, a venue, a specialist contractor — the template is a tax.",
    ],
  },
  {
    slug: "how-custom-discord-bots-increase-community-engagement",
    title: "Bots do not create culture. They remove friction.",
    date: "2026-04-02",
    readMin: 7,
    category: "Discord / Bots",
    dek: "A custom bot is closer to a concierge: it knows the welcome flow, the muted words, the shop, the season pass.",
    image: "/images/work-smokes.jpg",
    body: [
      "A public bot is a Swiss Army knife with 400 commands and no memory of your rules. People click it, get a wall, and go back to pinging mods.",
      "A custom bot is closer to a concierge. It knows the welcome flow, the muted words, the shop, the season pass. It does the jobs that used to sit in a Google Doc titled 'please read.'",
      "The 300% number: We have seen onboarding completion and weekly chatters move like that when the first ten minutes of a new member's life are automated well. That is not magic. That is not having to find the right channel while three bots yell.",
      "If you want a bot that plays music and also runs a bank and also does tickets, we will still ask which of those is the product.",
    ],
  },
  {
    slug: "dark-web-aesthetic-trends-2026",
    title: "Dark does not mean neon",
    date: "2026-03-18",
    readMin: 5,
    category: "Design / Type",
    dek: "The sites that still feel expensive in the dark went the other way: near-black, one metal accent, type you can sit with.",
    image: "/images/work-nights.jpg",
    body: [
      "Cyberpunk as a brand cue aged into a cliché: purple bloom, scanlines on everything, a HUD that fights the content. The sites that still feel expensive in the dark went the other way. Near-black. One metal accent. Type you can sit with.",
      "We kept the terminal language — status, clocks, mono labels — and threw out the rave. If a glow is doing the job of a hierarchy, the hierarchy failed.",
    ],
  },
  {
    slug: "how-to-choose-the-right-developer",
    title: "How to hire a studio without getting a pitch deck",
    date: "2026-02-09",
    readMin: 6,
    category: "Studio / Process",
    dek: "Ask who will design, who will commit, and who is on the hook the week after launch.",
    image: "/images/work-crete.jpg",
    body: [
      "Most agencies are a sales layer on top of a freelancer network. That is fine if you know it. It is not fine if you thought you bought a studio.",
      "Ask who will design, who will commit, and who is on the hook the week after launch. Ask for a site they still maintain. Ask what they refused to build last quarter.",
      "A useful test: Send a messy brief. See if they send back a smaller one. The people who add scope to look busy are the people who will invoice you for looking busy.",
    ],
  },
  {
    slug: "mastering-serverless-architecture",
    title: "Serverless is a tool. Bots still need a socket.",
    date: "2026-01-22",
    readMin: 6,
    category: "Infra / Architecture",
    dek: "Serverless is excellent for bursty HTTP. It is a poor home for anything that must hold a connection.",
    image: "/images/work-host.jpg",
    body: [
      "Serverless is excellent for bursty HTTP. It is a poor home for anything that must hold a connection. We still meet briefs that try to host a bot on a function because 'scale.'",
      "Use the right idle: a small always-on process for the gateway, functions for the webhooks, a database that is not a spreadsheet. Boring, on purpose.",
    ],
  },
  {
    slug: "the-future-of-api-architecture",
    title: "APIs that other humans can stand",
    date: "2025-12-11",
    readMin: 5,
    category: "API / Engineering",
    dek: "GraphQL or REST is a preference. Undocumented 500s with HTML in the body is a choice.",
    image: "/images/work-pulse.jpg",
    body: [
      "The future of your API is the same as the past of a good one: a contract. GraphQL or REST is a preference. Undocumented 500s with HTML in the body is a choice.",
      "We design resources, auth, and rate limits before a single handler. Then we generate the collection you will actually import. That is the whole future.",
    ],
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah J.",
    role: "Community Manager, Elite Gaming",
    date: "2026-07-22",
    quote:
      "The custom Discord bot replaced three public bots and a spreadsheet. Onboarding is automatic. Moderation logs are something I can actually read. Engagement went up because people stopped waiting on staff.",
  },
  {
    name: "Marcus T.",
    role: "Founder, CyberTrade",
    date: "2026-06-14",
    quote:
      "The platform they designed for us is quiet and fast. Dark, specific, no carnival. Performance held up under a real launch. I would hire them again for the next surface.",
  },
];

export const PIPELINE = [
  {
    n: "01",
    title: "Discovery",
    body: "A written brief: audience, constraints, host, and what has to be true in 90 days. No Figma until that exists. Typical: one weekday to reply, then a 45-minute call if it fits.",
  },
  {
    n: "02",
    title: "Design",
    body: "Tokens, type, key pages at 390px first. You get screens you can reject — not a moodboard. Web design in the catalog is $750; a single landing page is $150.",
  },
  {
    n: "03",
    title: "Engineering",
    body: "React, Node, Postgres unless the job says otherwise. Discord.js or Telegram Bot API when it is a bot. Staging URL, migrations, auth. Web development is $1,250; a custom bot is $99.",
  },
  {
    n: "04",
    title: "Deploy",
    body: "TLS, backups, first week of traffic covered. Site hosting $19.99/mo, bot hosting $9.99/mo, or we hand you the repo and the runbook. We do not disappear on launch day.",
  },
];

export const BILLING = [
  {
    title: "Project",
    tag: "Fixed scope",
    body: "A written brief, a price, a date. Design through deploy. Best when you know the job — a site, a bot, a storefront.",
    includes: [
      "Discovery workshop",
      "Design + engineering",
      "Launch week coverage",
      "30-day patch window",
    ],
  },
  {
    title: "Retainer",
    tag: "Monthly",
    body: "Hosting, bots, and a block of hours after launch. Catalog hosting is $19.99/mo for sites, $9.99/mo for bots; retainers add a named hour block.",
    includes: [
      "Managed cloud or bot hosting",
      "Scheduled updates",
      "Priority queue",
      "Monthly status note",
    ],
  },
  {
    title: "Rescue",
    tag: "Time & materials",
    body: "Something is live and hurting. We isolate, patch, and leave a runbook — no rebuild unless you ask. 72-hour triage is the default first move.",
    includes: [
      "72-hour triage",
      "Backup before touch",
      "Root-cause note",
      "Optional follow-on project",
    ],
  },
];

export const PRINCIPLES = [
  {
    n: "01",
    title: "Aesthetic, then invisible",
    body: "IBM Plex, near-black, one sage signal. No gradient blobs, no stock neon. If a screen needs a second accent to work, the layout is wrong. The type pass is in the brief, not a polish week at the end.",
  },
  {
    n: "02",
    title: "Code that survives a year",
    body: "Postgres with backups, a staging URL before production, tokens vaulted, a runbook in the repo. Catalog jobs include a 30-day patch window. Pretty that cannot deploy is a mock — we do not invoice for mocks.",
  },
  {
    n: "03",
    title: "Build with, not at",
    body: "A four-question brief (what, budget, timing, notes) before pixels. We will cut a feature that does not change the 90-day outcome. Specialists, if any, are named in writing. You are not buying a sales layer.",
  },
];

export const IN_SCOPE = [
  "Marketing sites & storefronts",
  "Product UI / internal tools",
  "Discord & Telegram systems",
  "APIs, workers, Postgres",
  "Managed hosting & process watch",
  "SEO and campaign structure",
];

export const OUT_OF_SCOPE = [
  "Native iOS / Android apps",
  "Print, packaging, fashion",
  "Paid media spend management at scale",
];

export const STACK = [
  { name: "React", note: "Sites, apps, this studio OS" },
  { name: "TypeScript", note: "The default. Fewer 3 a.m. surprises" },
  { name: "Node.js", note: "APIs, workers, Discord.js, Telegram" },
  { name: "PostgreSQL", note: "Ledgers, CMS, anything that must remember" },
  { name: "Prisma", note: "Schema and migrations we can hand off" },
  { name: "Discord API", note: "Slash commands, economy, moderation" },
  { name: "Telegram API", note: "Menus, shop desks, broadcasts" },
  { name: "Stripe", note: "When money has to move" },
];

export const FAQS = [
  {
    q: "Who actually does the work?",
    a: "Juan Socarras, principal. If a job needs a specialist (motion, photography, a second language), they are named in the brief with a line item. You are not buying a sales layer.",
  },
  {
    q: "How do we start?",
    a: "Open a brief: what you need (Build / Automate / Host / Amplify), budget band, timing, and a paragraph of notes. Weekday first response within 24 hours — often faster on Discord or Telegram (@n3xusg). If we are wrong for it, we say so.",
  },
  {
    q: "Do you take equity or revenue share?",
    a: "No. Cash for work. Hosting and retainers are monthly. Digital goods (Discord Economy Bot Template $49.99, UI kit $29.99) are a one-production license, not a partnership.",
  },
  {
    q: "Are these prices final?",
    a: "Yes — these are final prices, not starting points. Web design $750, web development $1,250, custom Discord or Telegram bot $99, landing page $150, managed site hosting $19.99/mo. Custom auth, data migrations, or a second language are scoped on top as separate line items — never a surprise invoice for the listed job.",
  },
  {
    q: "Where are you?",
    a: "South Texas, America/Chicago. Desk Monday–Friday 09:00–18:00. Remote by default. On-site photography or a handshake by arrangement. studio@n3xuskonc3ptz.com",
  },
  {
    q: "Can you take over a site you did not build?",
    a: "Yes — Rescue or Website Work. We need repo or host access. We will not pretend a tangle is a two-hour job. Backup first, then a root-cause note, then a price to fix or rebuild.",
  },
];

export const BRIEF_QUESTIONS = {
  what: ["Build", "Automate", "Host", "Amplify"],
  budget: ["Under $500", "$500–2k", "$2k–8k", "$8k+", "Not sure"],
  timing: ["ASAP", "This month", "This quarter", "Exploring"],
};
