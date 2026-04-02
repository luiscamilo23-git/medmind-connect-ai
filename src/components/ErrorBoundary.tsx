import React from "react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[MEDMIND ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Algo salió mal</h1>
          <p className="text-muted-foreground mb-6">
            Ocurrió un error inesperado. Recarga la página o contacta soporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
