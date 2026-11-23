import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
 const products=[
  {slug:"discord-community-starter",name:"Discord Community Starter",summary:"A clean foundation for a feature-rich Discord community bot.",description:"Starter product placeholder. Add the exact included features, compatibility matrix, license terms, update policy, and delivery instructions before publishing.",category:"Bot templates",priceCents:4999,featured:true},
  {slug:"automation-blueprint",name:"Automation Blueprint Pack",summary:"Reusable workflow patterns for connected business operations.",description:"A collection of automation blueprints. Document each workflow, supported services, prerequisites, and maintenance requirements before publishing.",category:"Automation",priceCents:2999,featured:false},
  {slug:"client-portal-ui-kit",name:"Client Portal UI Kit",summary:"A polished starting point for customer-facing project workspaces.",description:"A UI kit placeholder. Include file formats, license scope, framework version, and support policy before publishing.",category:"Design systems",priceCents:3900,featured:false},
  // N3xUs Konc3pt'z store — digital goods from the studio site (2026-11-23).
  // These are the same products /store sells; the store page falls back to a
  // "contact the studio" state until the seed has run in production.
  {slug:"advanced-discord-economy-bot-template",name:"Discord Economy Bot Template",summary:"The same Postgres-backed pattern we use on client servers, stripped of private branding.",description:"Slash commands, a currency with sinks, inventory, and a moderation-safe admin surface. You bring the token and the rules. Includes: Discord.js source; Postgres schema + seed; economy, shop, and job modules; admin commands and config; deploy notes for a VPS or our hosting. One-production license.",category:"Digital goods",priceCents:4999,featured:true},
  {slug:"cyberpunk-ui-component-kit-react",name:"Terminal UI Kit — React",summary:"The component language of this studio, packaged.",description:"IBM Plex, hairline borders, concentric radii, signal green used once. Buttons, inputs, tabs, data rows, and a command palette shell. Includes: React + Tailwind v4 components; token file (CSS @theme); command palette pattern; example dashboard page; usage notes. One-production license.",category:"Digital goods",priceCents:2999,featured:false},
  {slug:"telegram-auto-responder-script",name:"Telegram Auto-Responder",summary:"A focused script for shops and community desks that need a reliable first reply.",description:"A button menu and a path to a human. Logging included. Extend it or leave it alone. Includes: bot script + env sample; menu and hours config; handoff to a human chat; basic rate limiting; run instructions. One-production license.",category:"Digital goods",priceCents:1999,featured:false},
  {slug:"n3xus-premium-dark-mode-css-theme",name:"N3xUs Dark CSS Theme",summary:"A CSS-only theme for sites that need to go dark without a redesign.",description:"Near-black, bone type, sage signal. Works as a starting layer on top of a classless or lightly classed document. Includes: theme.css with tokens; optional grain overlay; form and table styles; reduced-motion guards. One-production license.",category:"Digital goods",priceCents:999,featured:false}
 ];
 for(const p of products)await prisma.product.upsert({where:{slug:p.slug},update:{},create:p});
 console.log("Seed products inserted.");
}
main().finally(()=>prisma.$disconnect());
