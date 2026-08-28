import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Something went wrong on this page.</p>
          <p className="text-sm text-gray-600 mb-4">Try going back and opening it again.</p>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.assign('/dashboard');
            }}
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
