import { Component, type ErrorInfo, type ReactNode } from 'react';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('KakuText ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-canvas p-4 text-ink">
          <div className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper">
            <KakuMascot mood="sleepy" size="lg" label="Sleepy mascot after an error" />
            <h1 className="text-xl font-black text-ink">Something spilled on the desk</h1>
            <p className="text-sm text-muted">{this.state.message}</p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.assign('/');
              }}
            >
              Return to Workspace
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}