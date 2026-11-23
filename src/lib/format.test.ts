import { describe, expect, it } from "vitest";
import { money } from "@/lib/format";

describe("money", () => {
  it("formats cents as USD", () => expect(money(4999)).toBe("$49.99"));
});
