import { Component } from "react";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900 p-6">
                    <div className="max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 text-center shadow">
                        <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-slate-100">Something Went Wrong</h2>
                        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Please reload the page.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
