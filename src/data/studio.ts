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
  emailJuan: "j.socarras@n3xuskonc3ptz.com",
  phone: "210-275-1837",
  phoneHref: "tel:+12102751837",
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
    price: "$625",
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
    price: "$375",
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
    price: "$250",
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
    price: "$75",
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
    price: "$50",
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
    price: "$100",
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
    slug: "native-android-app-development",
    name: "Native Android App Development",
    group: "Build",
    price: "$150",
    pitch:
      "A real native app for your business — not a website in a wrapper. Ordering, booking, loyalty, or a tool your crew actually uses, built with the Android SDK and signed, ready to install. This is the same bench that built SuperFiles and RemotePhone.",
    deliverables: [
      "Native Android build — no web wrappers",
      "Screens designed around your workflow",
      "Local database and offline storage",
      "Account sign-in and push notifications",
      "Signed release APK, ready to install",
      "Google Play submission support and source handoff",
    ],
  },
  {
    slug: "discord-bots",
    name: "Custom Discord Bots",
    group: "Automate",
    price: "$49.50",
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
    price: "$49.50",
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
    price: "$150",
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
    price: "$125",
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
    price: "$125",
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
    price: "$200",
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
    priceCents: 2499,
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
    priceCents: 1499,
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
    priceCents: 999,
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
    priceCents: 499,
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
    slug: "custom-discord-bot-for-small-business",
    title: "A custom Discord bot for a small business: what it actually does",
    date: "2026-11-27",
    readMin: 5,
    category: "Discord / Bots",
    dek: "It answers the same questions, takes orders, and keeps the server tidy. Here is what it does, what it does not do, and when it is worth $99.",
    image: "/images/work-zenith.jpg",
    body: [
      "A custom Discord bot is a small program that lives in your Discord server and does the repetitive work your team does by hand: answering the same questions, taking orders, posting announcements, and keeping the place tidy. It is not a mascot, and it is not magic. It is a tool, and for a small business in San Antonio with customers already on Discord, it is often the cheapest hire you will ever make. It does not need a desk, a schedule, or a day off.",
      "Here is what one actually does, day to day. A customer asks what time you close, and the bot answers before anyone on your staff has to type. Someone wants to order, and the bot takes the order, confirms it, and puts it where your team can see it. A new member joins, and the bot welcomes them and points them to the rules and the menu. You have a special on Friday, and the bot posts it to the right channel at the right time instead of you remembering to do it at 4 p.m. None of this is glamorous. All of it is time your people get back, and time is the one thing a small team never has enough of.",
      "A bot also does the quiet work nobody notices until it stops. It can watch for spam links and remove them before your customers see them. It can give regulars a role and keep newcomers out of staff channels. It can log who did what, so when something goes wrong you are not guessing. If your server has more than a handful of people in it, that kind of housekeeping is the difference between a community and a mess, and it is the work nobody on your team wants to do at 10 p.m.",
      "What a bot does not do matters just as much. It does not create a community. If nobody is talking in your server, a bot will not make them talk. It does not replace a person when a customer is upset or the order is wrong. It hands that conversation to a human, fast, instead of pretending it can fix it. And it does not know things you never told it. A bot answers from what you give it: your hours, your menu, your prices, your policies. If that information is wrong, the bot will be confidently wrong, which is worse than saying nothing at all.",
      "So when does it make sense for a small business in South Texas? The test is simple: are your customers already on Discord? If you run a game shop, a cafe with regulars, a gym, a tattoo studio, or a restaurant with a following, and your customers already hang out in a server, a bot meets them where they are. If your customers are not on Discord and never will be, a bot is the wrong tool, and a website or a phone number is the right one. We will tell you that before we take your money, because a bot nobody uses is a waste of $99, and we would rather have you as a customer later than a refund now.",
      "A custom Discord bot from us is $99, final. That is a bot built for your server and your rules, not a template with your name pasted on it. We build it with Discord.js, test it in a private server before it ever touches yours, and hand it over working. You also need somewhere for it to live. A bot has to be running to answer, and a bot on a laptop that goes to sleep is a bot that is down. Our managed bot hosting is $9.99 a month, and it keeps the bot online, updated, and watched. If you would rather host it yourself, we hand you the code and the runbook and you own it outright.",
      "Before you hire anyone to build one, ask three questions. First, who owns the code: you, or the person who built it? Second, what happens when it goes down at 9 p.m. on a Saturday, and who fixes it? Third, can it grow: can it take orders today and bookings next month without being rebuilt from scratch? If the answers are vague, keep looking. A bot is a small piece of software, but it is still software, and the same rules apply. You should own it, someone should watch it, and it should be built to change.",
      "Start with the job, not the bot. Write down the three things your staff repeats most in Discord: the question, the order, the announcement. That list is your bot. If the list is real, a custom Discord bot will pay for itself in a week of saved typing. If the list is empty, spend the money on something else. Either way, you will know before you spend it, and that is the whole point."
    ],
  },
{
    slug: "how-long-does-it-take-to-build-a-website",
    title: "How long does it take to build a website, really?",
    date: "2026-11-26",
    readMin: 5,
    category: "Studio / Process",
    dek: "A landing page takes about a week, a full website about two. Here is what decides the date, and what slows it down.",
    image: "/images/work-crete.jpg",
    body: [
      "How long does it take to build a website? If you ask around San Antonio, the answer you usually get is a shrug, or a range so wide it means nothing. Here is the honest version: a landing page takes about a week. A full custom website takes about two weeks. A site with real engineering behind it takes longer, and anyone who gives you a date before they have seen the work is guessing.",
      "A landing page is one page with one job. It is the fastest thing we build, and it is fast because there is less to decide: one offer, one audience, one action. We design it, build it, write the copy with you, and wire up the form. That is about five to seven days from the day we start, and most of that time is you looking at it and telling us what to change. Our landing page is $150, final, and it is built so it can grow into a full site later instead of being thrown away. The reason it moves fast is that the decisions are small and the feedback loop is short: you see it, you react, we change it, and the next day it is done.",
      "A full website is a different job. There are more pages, more copy, and more decisions: services, about, hours, contact, the pages Google finds when someone searches for what you do. We build a custom website in 14 days or less, start to finish. That is not a rush job. It is the pace you get when the design is custom but the process is settled. We know what we need from you, and we ask for it up front instead of discovering it in week three.",
      "Web development is where the calendar stretches. If the site needs bookings, accounts, a store, an API, or one system talking to another, that is engineering, not design. Web development is $1,250, and the timeline depends on what it has to do. A booking form is days. A store with real products and payments is weeks. We will give you a date before we start, and we will not give you one before we understand the work. The other reason a bigger build takes longer is that it has to be tested like a tool, not looked at like a picture. A form that takes a booking has to take the booking every time, on a phone, on a slow connection, at midnight. That testing is part of the build, and it is the part you never see.",
      "The thing that slows a build down is almost never the building. It is the waiting. Copy that nobody has written. Photos that live on someone's phone. A decision about the offer that keeps changing. A site that should take two weeks takes two months because the business is still deciding what it sells. The fastest builds we have done had one thing in common: the owner knew the offer before we started. It also helps to know who decides. If three people have to approve the copy, the build takes as long as the slowest approval, not as long as the work. One person who can say yes is worth more to a timeline than any tool we own.",
      "So the way to get a straight answer is to bring a straight brief. What is the one thing the site has to do? Who is it for? What do they do next? If you can answer those three questions, we can give you a date, and we will hit it. If you cannot, that is fine too, but the first week of the build will be spent answering them. That is honest work, not wasted time, and it is better to do it at the start than to rebuild a finished site around a new answer.",
      "Here is what to expect from us. We will tell you the price before we start, and it will not change: web design is $750, a landing page is $150, web development is $1,250. Managed site hosting is $19.99 a month once it is live, which covers the hosting, the certificate, the backups, and the updates. We build a standard site in 14 days or less. If something in your project needs more time, we will say so on day one, not day thirteen. And if you already have a site that is doing its job, you do not need a new one. A redesign makes sense when the site is costing you customers, not when you are bored of looking at it.",
      "If you run a business in San Antonio or anywhere in South Texas and you have been putting a website off because you do not know how long it will take, the answer is simpler than you think. A page takes a week. A site takes two. The hard part is deciding what it should do, and that part is yours. Once you know, we can build it, and we can tell you the day it will be done.",
    ],
  },
{
    slug: "landing-page-vs-website-san-antonio",
    title: "Landing page vs. website: which one does a San Antonio business need?",
    date: "2026-11-25",
    readMin: 5,
    category: "Design / Conversion",
    dek: "One page with one job, or the whole business online: how to tell which one you need first.",
    image: "/images/studio-desk.jpg",
    body: [
      "A landing page San Antonio businesses ask us about is usually one page with one job: get the visitor to do one thing. Book the table. Get the quote. Call the shop. A website is the whole business online: the services, the about page, the hours, the contact page, the pages Google finds when someone searches for what you do. The question is not which one is better. The question is which job you need done first.",
      "A landing page is enough when you have one offer and one audience. A roofer running ads after a hail storm. A food truck announcing a new spot for the weekend. A shop pushing one seasonal sale. The visitor arrives, reads the offer, sees the proof, fills in the form. There is nothing else to click, and that is the point. Our landing page is $150: one page, custom designed and built, with the copy, the layout, and a form that actually submits.",
      "A landing page is not enough when people need to find you and learn about you. Someone hears your name from a friend and searches for it. They want your hours, your menu, your services, your location. A single page cannot carry all of that, and it cannot rank for the searches that bring you new customers. That is what a website is for. Web design is $750, and it is the address you own instead of a page you rent from an ad platform.",
      "The mistake we see most is buying the big site first and then never finishing the copy for it, or buying the landing page and then trying to make it do the work of a site. Both cost more than doing it in the right order. Start with the page that makes money, then add the pages that answer questions. We build a landing page so it can grow into a site, same design language and same code, instead of building something you throw away in six months.",
      "Cost is the other half of the decision, and it should be plain. A landing page is $150. A full website design is $750. If the site needs real engineering, bookings, accounts, an API, a store, web development is $1,250. Managed site hosting is $19.99 a month, which covers the box, the certificate, the backups, and the updates. Those are final prices, not starting points, and a custom site from us is built in 14 days or less. If a quote does not list what is included, it is not a quote. After launch, the two need different care. A landing page is a campaign asset: you check the form submissions, you change the offer when the campaign ends, and most months there is nothing to do. A website is a living address: hours change, services change, pages get added, and someone has to keep the software patched and the backups running. That is what managed hosting is for, and it is why a landing page on its own is cheap to own and a website on its own needs an owner. Neither one maintains itself, and the page nobody updates is the page that starts lying about your hours.",
      "Three questions settle it. First, do people search for more than one thing you do? If yes, you need the pages a website gives you. Second, do you need to be found on Google for your services? A landing page can rank for one thing. A website can rank for all of them. Third, are you running ads to one offer? That is the landing page's job, and a website with five exits will do it worse. If you answered yes to the first two, get the website. If only the third applies, get the landing page and spend the difference on the ads.",
      "There is one more case worth naming: the business that already has a website and still needs a landing page. Your site answers every question. Your ad answers one. Sending ad traffic to the homepage is how a good offer dies in a navigation menu. A landing page gives the ad somewhere to land that matches what the ad promised, same offer, same words, same button. It is not a replacement for the site. It is the front door you build for one campaign.",
      "What we ask before we build either one is the same: what is the offer, who is it for, and what is the one action you want? If you cannot name the one action, you need the website conversation first, because a page without a job is a brochure. If you can name it in one sentence, the landing page is probably the right spend. Either way, the answer is in the brief, not in the template. Write to studio@n3xuskonc3ptz.com or call 210-275-1837 and tell us the offer. We will tell you which one it needs.",
    ],
  },
{
    slug: "san-antonio-small-business-website-checklist",
    title: "The San Antonio small business website checklist",
    date: "2026-11-24",
    readMin: 4,
    category: "Web Design / San Antonio",
    dek: "Ten things to check on your own site before you spend a dollar on ads — from the phone number to the map pin, in the order that matters.",
    image: "/images/hero-studio.jpg",
    body: [
      "If you run a small business in San Antonio, your website is the first person a customer meets — and it works the hours you don’t. This checklist is for a small business website San Antonio owners depend on every day: the site for the shop, the truck, the studio, or the restaurant. Open it on your phone and work through it. If an item fails, fix it before you spend anything on ads.",
      "One: the phone number. It should be at the top of every page, and tapping it should start a call. If a customer has to hunt for it or copy it into a dialer, they are gone. Two: the hours. They should match what is on your door and what Google shows, including holidays and the days you close early. Three: the address and the map. A customer should be able to tap once and get directions. If the address on your site disagrees with your Google Business Profile, Google trusts neither, and neither will a customer driving across town.",
      "Four: one page for each thing you actually sell. A restaurant needs a menu page, a shop needs its services, a contractor needs each trade spelled out. Lumping everything onto one page means Google has nothing to show for a specific search, and a visitor has nothing to land on. Five: say what you do in the words your customers use. Nobody searches for fancy phrases. They search for tacos near me, or an electrician in Alamo Heights. Write the way your customers talk, and the site will be found by the people it is for.",
      "Six: photos of the real place. Your food, your shop, your crew, your work. Stock photos of a smiling stranger do not sell a South Texas business. A phone camera and good light are enough. If the photos on the site are not of your business, a visitor who walks in will feel misled before you have said a word.",
      "Seven: speed on a phone. Most of your visitors are on a phone, often on a bad connection. If the page takes more than a few seconds to show something useful, they leave — and they do not come back to tell you why. Big images are usually the cause. Eight: one clear action per page. Call, book, order, or get a quote. A page that asks a visitor to do four things asks them to do nothing. Check the form actually submits, too. A form that swallows messages is worse than no form, because you will never know what you lost.",
      "Nine: someone is in charge after launch. A site is not finished the day it goes live. Prices change, hours change, links break, and software needs updates. Decide who does that before launch, not after the first broken page. Managed site hosting is $19.99 a month with us, which covers the box, the backups, and the updates — the point is that someone is watching it. Ten: you own it. The domain is in your name, the hosting is in your name, and you can walk away with the site. If a vendor holds the keys, you are renting your own business card.",
      "What does it cost to get this right? A landing page is $150 and covers one offer on one page — right when you have a single service and need it live this week. A full website is $750 for web design, and $1,250 for web development when the site has to do real work like booking, ordering, or payments. Those are final prices, not estimates that grow in the first call. If your site fails half this list, you do not need a new site — you need someone to fix the list. Send a brief to studio@n3xuskonc3ptz.com or call 210-275-1837, and tell us which items failed. We will tell you what it takes to fix them, in plain terms, before you pay anything.",
    ],
  },
{
    slug: "how-much-does-web-design-cost-san-antonio",
    title: "How much does web design cost in San Antonio?",
    date: "2026-11-23",
    readMin: 5,
    category: "Web Design / San Antonio",
    dek: "A straight answer for a San Antonio small business: what you are actually paying for, what a $150 landing page covers, and when a custom site earns its keep.",
    image: "/images/studio-desk.jpg",
    body: [
      "If you search for web design in San Antonio, you will get prices from $99 to $10,000 and no explanation for the gap. Both ends can be honest. The difference is what is included, who does the work, and who is still there the week after launch.",
      "Here is what we charge, because a price list you have to ask for is not a price list. A landing page is $150. Web design is $750. Web development starts at $1,250. A custom Discord or Telegram bot is $99. Managed site hosting is $19.99 a month. Those are final prices for the listed job, not starting points that double in the first call.",
      "A landing page covers one job: one offer, one page, one action. It is right when you have a single service, a launch, or a test you want live this week. It is wrong when a customer needs to compare services, read about the shop, or find you on a map and call from the same visit. That is a website, and it costs more because it does more.",
      "What actually drives the price is not the number of pages. It is the decisions. Who writes the copy. Who takes or sources the photos. Whether a customer can book, order, or pay on the page. Whether the site has to work on a cracked phone screen on a bad connection, which is how most of your customers will meet it.",
      "A template is the cheapest way to look like everyone else. We have written before that templates convert until they do not, and the same holds here. If your shop, your food, or your trade is the reason people come, the site should sound like the business. A visitor who has seen your hero section on three other sites has already decided you are interchangeable.",
      "Three questions to ask any San Antonio web designer before you pay. Who owns the domain and the hosting when we are done. Who fixes it when it breaks, and what that costs. And show me a site you still maintain a year later, not just one you launched. The answers tell you more than a portfolio does.",
      "Local search is the other half of the price question. A site that Google cannot read is a brochure in a drawer. That means a real business name, address, and phone number that match everywhere, a Google Business Profile that is actually finished, pages that load fast on a phone, and one page per service you want to be found for. None of that is magic. It is maintenance, and it is the part most cheap sites skip.",
      "If you want a number for your job, send a brief. Tell us what the site has to do in 90 days, what you already have, and what has to be true after launch. We will send back a smaller brief and a fixed price. You can reach the desk at studio@n3xuskonc3ptz.com or 210-275-1837, Monday to Friday, 09:00 to 18:00.",
    ],
  },
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
    body: "Tokens, type, key pages at 390px first. You get screens you can reject — not a moodboard. Web design in the catalog is $375; a single landing page is $75.",
  },
  {
    n: "03",
    title: "Engineering",
    body: "React, Node, Postgres unless the job says otherwise. Discord.js or Telegram Bot API when it is a bot. Staging URL, migrations, auth. Web development is $625; a custom bot is $49.50.",
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
  "Native Android apps",
  "Discord & Telegram systems",
  "APIs, workers, Postgres",
  "Managed hosting & process watch",
  "SEO and campaign structure",
];

export const OUT_OF_SCOPE = [
  "Native iOS apps",
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
  { name: "Android SDK", note: "Native apps — signed, Play-ready" },
];

export const FAQS = [
  {
    q: "Who actually does the work?",
    a: "Juan Socarras, principal. If a job needs a specialist (motion, photography, a second language), they are named in the brief with a line item. You are not buying a sales layer.",
  },
  {
    q: "How do we start?",
    a: "Open a brief: what you need (Build / Automate / Host / Amplify), budget band, timing, and a paragraph of notes. Weekday first response within 24 hours. If we are wrong for it, we say so.",
  },
  {
    q: "Do you take equity or revenue share?",
    a: "No. Cash for work. Hosting and retainers are monthly. Digital goods (Discord Economy Bot Template $24.99, UI kit $14.99) are a one-production license, not a partnership.",
  },
  {
    q: "Are these prices final?",
    a: "Yes — these are final prices, not starting points. Web design $375, web development $625, custom Discord or Telegram bot $49.50, landing page $75, managed site hosting $19.99/mo. Custom auth, data migrations, or a second language are scoped on top as separate line items — never a surprise invoice for the listed job.",
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
