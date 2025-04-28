import React from 'react';
import { useSelector } from 'react-redux';

class ErrorBoundaryClass extends React.Component {
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
                <div className={`min-h-screen flex items-center justify-center p-4 
                    ${this.props.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                    <div className={`max-w-md w-full p-6 rounded-lg shadow-xl 
                        ${this.props.darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                        <p className={`mb-4 ${this.props.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            We're sorry, but an error has occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className={`px-4 py-2 rounded-md transition-colors duration-200 
                                ${this.props.darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4">
                                <details className={`${this.props.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <summary className="cursor-pointer">Show Error Details</summary>
                                    <pre className={`mt-2 p-4 rounded overflow-auto text-sm 
                                        ${this.props.darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        {this.state.error.toString()}
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to access Redux state
export default function ErrorBoundary({ children }) {
    const { darkMode } = useSelector(state => state.auth);
    return <ErrorBoundaryClass darkMode={darkMode}>{children}</ErrorBoundaryClass>;
}