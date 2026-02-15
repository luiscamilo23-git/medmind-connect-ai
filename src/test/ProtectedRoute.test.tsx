import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => ({ data: { role: "doctor" }, error: null })),
      })),
      maybeSingle: vi.fn(() => ({ data: { role: "doctor" }, error: null })),
    })),
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}));

import { ProtectedRoute } from "@/components/ProtectedRoute";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    mockGetSession.mockReturnValue(new Promise(() => {})); // Never resolves
    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(container.textContent).toContain("Verificando sesión...");
  });

  it("renders children when authenticated", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
    });

    const { findByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(await findByText("Protected Content")).toBeTruthy();
  });

  it("does not render children when no session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { queryByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await vi.waitFor(() => {
      expect(queryByText("Protected Content")).toBeNull();
    });
  });
});
