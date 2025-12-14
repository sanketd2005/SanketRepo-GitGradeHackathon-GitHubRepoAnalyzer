import { useState } from 'react';
import { Search, Github } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface RepositoryInputProps {
  onAnalyze: (url: string) => void;
  disabled?: boolean;
}

export function RepositoryInput({ onAnalyze, disabled }: RepositoryInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  const isValidGitHubUrl = (url: string) => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubPattern.test(url);
  };

  const urlIsValid = url.trim() === '' || isValidGitHubUrl(url);

  return (
    <div className="rounded-2xl bg-slate-800/50 p-8 backdrop-blur-sm border border-slate-700/50">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2">
          <Github className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl text-white">Enter Repository URL</h2>
          <p className="text-sm text-slate-400">
            Paste a public GitHub repository URL for analysis
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="url"
            placeholder="https://github.com/username/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            className="h-12 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
          />
          {!urlIsValid && (
            <p className="mt-2 text-sm text-red-400">
              Please enter a valid GitHub repository URL
            </p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            Example: https://github.com/facebook/react
          </p>
        </div>

        <Button
          type="submit"
          disabled={disabled || !url.trim() || !urlIsValid}
          className="h-12 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          <Search className="mr-2 h-5 w-5" />
          {disabled ? 'Analyzing...' : 'Analyze Repository'}
        </Button>
      </form>

      <div className="mt-6 rounded-lg bg-slate-900/50 p-4 border border-slate-700/30">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Note:</strong> Only public GitHub repositories can be
          analyzed. The analysis may take 10-30 seconds depending on repository size.
        </p>
      </div>
    </div>
  );
}
