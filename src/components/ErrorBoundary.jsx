import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('PokéDex Arena render error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-crash">
        <div className="app-crash-card glass">
          <div className="app-crash-icon">⚡</div>
          <p className="eyebrow">ARENA RECOVERY</p>
          <h1>Something went <span>off-script.</span></h1>
          <p>The interface hit an unexpected rendering error. Reloading the app should recover it without changing your saved trainer data.</p>
          <button className="primary-btn" onClick={this.handleReload}>Reload Arena</button>
          {this.state.error?.message && <code>{this.state.error.message}</code>}
        </div>
      </div>
    );
  }
}
