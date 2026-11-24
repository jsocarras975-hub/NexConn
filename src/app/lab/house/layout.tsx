import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/lab/house", "House — Casino Sandbox", "Slots, coinflip, dice, roulette, blackjack — the same command surface we ship on client Discord servers. Sandbox chips, real house edge.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
