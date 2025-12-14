import { useState } from 'react';
import { RepositoryInput } from './components/RepositoryInput';
import { AnalysisResults } from './components/AnalysisResults';
import { analyzeRepository } from './utils/repositoryAnalyzer';
import { GitBranch, Loader2 } from 'lucide-react';
import type { AnalysisResult } from './types';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeRepository(url);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <GitBranch className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl text-white">Repository Mirror</h1>
              <p className="text-slate-400">
                AI-Powered Repository Evaluation System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Info Section */}
          {!result && !loading && (
            <div className="mb-12 rounded-2xl bg-slate-800/50 p-8 backdrop-blur-sm border border-slate-700/50">
              <h2 className="mb-4 text-2xl text-white">
                Professional Repository Analysis
              </h2>
              <p className="mb-6 text-slate-300">
                Get comprehensive feedback on your GitHub repository from the perspective of
                recruiters, mentors, and senior software engineers. Our AI analyzes code quality,
                structure, documentation, testing practices, and more.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700/30">
                  <div className="mb-2 text-blue-400">📊 Detailed Scoring</div>
                  <p className="text-sm text-slate-400">
                    Multi-dimensional evaluation with clear metrics
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700/30">
                  <div className="mb-2 text-green-400">📝 Professional Summary</div>
                  <p className="text-sm text-slate-400">
                    Concise assessment of strengths and weaknesses
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-4 border border-slate-700/30">
                  <div className="mb-2 text-purple-400">🎯 Action Plan</div>
                  <p className="text-sm text-slate-400">
                    Personalized roadmap for improvement
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Input Section */}
          <RepositoryInput onAnalyze={handleAnalyze} disabled={loading} />

          {/* Loading State */}
          {loading && (
            <div className="mt-12 rounded-2xl bg-slate-800/50 p-12 text-center backdrop-blur-sm border border-slate-700/50">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-400 mb-4" />
              <h3 className="text-xl text-white mb-2">Analyzing Repository...</h3>
              <p className="text-slate-400">
                Fetching repository data and evaluating code quality, structure, and best practices
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-12 rounded-2xl bg-red-900/20 p-8 backdrop-blur-sm border border-red-700/50">
              <h3 className="text-xl text-red-400 mb-2">Analysis Failed</h3>
              <p className="text-red-300">{error}</p>
              <p className="mt-4 text-sm text-slate-400">
                Please ensure the repository URL is correct and the repository is public.
              </p>
            </div>
          )}

          {/* Results */}
          {result && <AnalysisResults result={result} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>
            Repository Mirror provides honest, actionable feedback to help developers improve their
            projects
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Analysis based on industry standards and best practices
          </p>
        </div>
      </footer>
    </div>
  );
}
