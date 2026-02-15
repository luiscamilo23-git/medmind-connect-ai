import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn (classnames)", () => {
    it("merges class names correctly", () => {
      const result = cn("base-class", "additional-class");
      expect(result).toContain("base-class");
      expect(result).toContain("additional-class");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toContain("active");
    });

    it("handles falsy values", () => {
      const result = cn("base", false && "hidden", undefined, null);
      expect(result).toBe("base");
    });

    it("merges tailwind classes properly", () => {
      const result = cn("px-4 py-2", "px-6");
      expect(result).toContain("px-6");
      expect(result).not.toContain("px-4");
    });
  });
});
