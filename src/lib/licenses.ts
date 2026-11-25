import { randomBytes } from "node:crypto";

// License keys look like N3XUS-AB3DE-FGH4J-KLM5N: 15 characters from an
// alphabet without look-alike characters (no 0/O, 1/I/L), ~74 bits of
// entropy — unguessable, and the database unique constraint is the backstop.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateLicenseKey(): string {
  const bytes = randomBytes(15);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]);
  return `N3XUS-${chars.slice(0, 5).join("")}-${chars.slice(5, 10).join("")}-${chars.slice(10, 15).join("")}`;
}
