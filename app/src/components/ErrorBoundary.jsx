"use client";

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600" />
            <div className="p-7">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                Something went wrong
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                We apologize for the inconvenience. The application encountered an unexpected error.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 p-3 bg-gray-100 rounded text-xs">
                  <summary className="cursor-pointer font-semibold">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;