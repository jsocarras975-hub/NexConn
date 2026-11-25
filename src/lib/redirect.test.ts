import { describe, expect, it } from "vitest";
import { safeNextParam } from "@/lib/redirect";

describe("safeNextParam", () => {
  it("passes a same-origin path through", () => {
    expect(safeNextParam("/cart")).toBe("/cart");
    expect(safeNextParam("/marketplace")).toBe("/marketplace");
  });
  it("falls back to the portal for nothing", () => {
    expect(safeNextParam(null)).toBe("/portal");
    expect(safeNextParam("")).toBe("/portal");
  });
  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeNextParam("//evil.com")).toBe("/portal");
    expect(safeNextParam("https://evil.com")).toBe("/portal");
    expect(safeNextParam("http://evil.com/x")).toBe("/portal");
  });
});
