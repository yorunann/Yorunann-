import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('scoreboard_state');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center select-none z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="text-4xl">⚾</div>
            <h2 className="text-xl font-bold text-yellow-400">計分板載入發生問題</h2>
            <p className="text-xs sm:text-sm text-slate-300 break-words font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left">
              {this.state.error?.message || '未知錯誤，請重整頁面'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs sm:text-sm font-semibold transition-colors text-white cursor-pointer"
              >
                重新載入
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs sm:text-sm font-semibold transition-colors text-slate-200 cursor-pointer"
              >
                重設狀態快取
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
