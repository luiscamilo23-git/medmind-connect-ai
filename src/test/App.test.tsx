import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "@/App";

// Mock all page components to avoid deep rendering
vi.mock("@/pages/Landing", () => ({ default: () => <div>Landing Page</div> }));
vi.mock("@/pages/Auth", () => ({ default: () => <div>Auth Page</div> }));
vi.mock("@/pages/Dashboard", () => ({ default: () => <div>Dashboard</div> }));
vi.mock("@/pages/NotFound", () => ({ default: () => <div>Not Found</div> }));

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
