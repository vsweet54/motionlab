"use client";

import React, { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-2xl bg-surface-100 border border-red-500/20 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Component Error</h3>
          <p className="text-xs text-zinc-400">
            {this.state.error?.message || "Failed to render this panel."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-border text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
