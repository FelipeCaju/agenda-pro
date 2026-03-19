import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";
import { logDiagnosticError } from "@/utils/logger";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logDiagnosticError("react_boundary", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          description="Ocorreu uma falha inesperada na interface. Registramos detalhes no console para diagnostico sem perder o visual do app."
          onRetry={this.handleRetry}
          title="Algo saiu do esperado"
        />
      );
    }

    return this.props.children;
  }
}
