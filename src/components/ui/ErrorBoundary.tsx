import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTab?: string;
  onResetTab?: () => void;
  key?: string | number;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MediFlow Unhandled Component Error Caught:", error, errorInfo);
  }

  private handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetTab) {
      this.props.onResetTab();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-xl space-y-4 max-w-2xl mx-auto text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Module View Error Intercepted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              A temporary display error occurred in this view. The rest of the system remains operational and safe.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-mono text-[11px] text-rose-600 dark:text-rose-400 text-left overflow-x-auto border border-slate-200 dark:border-slate-700">
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry This View</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                if (this.props.onResetTab) this.props.onResetTab();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Main Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
