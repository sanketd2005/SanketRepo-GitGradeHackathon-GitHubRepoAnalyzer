import { Trophy, TrendingUp, FileText, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { AnalysisResult } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const overallPercentage = (result.overallScore / result.maxScore) * 100;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'Silver':
        return 'bg-gradient-to-r from-slate-400 to-slate-500';
      default:
        return 'bg-gradient-to-r from-orange-700 to-orange-800';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'text-purple-400';
      case 'Advanced':
        return 'text-blue-400';
      case 'Intermediate':
        return 'text-green-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="mt-12 space-y-8">
      {/* Overall Score Card */}
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
        <div className={`h-2 ${getTierColor(result.tier)}`} />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl text-white mb-2">
                {result.repositoryName}
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge className={getTierColor(result.tier)}>
                  <Trophy className="mr-1 h-3 w-3" />
                  {result.tier} Tier
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  <span className={getSkillLevelColor(result.skillLevel)}>
                    {result.skillLevel}
                  </span>
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl text-white mb-1">
                {result.overallScore}
                <span className="text-2xl text-slate-400">/{result.maxScore}</span>
              </div>
              <div className="text-sm text-slate-400">Overall Score</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallPercentage} className="h-3 bg-slate-700" />
          <p className="mt-2 text-sm text-slate-400">
            {overallPercentage.toFixed(1)}% - {getScoreDescription(overallPercentage)}
          </p>
        </CardContent>
      </Card>

      {/* Tabs for Different Sections */}
      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="scores" className="data-[state=active]:bg-slate-700">
            📊 Detailed Scores
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-slate-700">
            📝 Summary
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="data-[state=active]:bg-slate-700">
            🎯 Roadmap
          </TabsTrigger>
        </TabsList>

        {/* Detailed Scores Tab */}
        <TabsContent value="scores" className="space-y-4 mt-6">
          <ScoreDimensionCard
            title="Code Quality & Readability"
            icon="💎"
            dimension={result.scores.codeQuality}
          />
          <ScoreDimensionCard
            title="Project Structure & Organization"
            icon="🏗️"
            dimension={result.scores.projectStructure}
          />
          <ScoreDimensionCard
            title="Documentation & Clarity"
            icon="📚"
            dimension={result.scores.documentation}
          />
          <ScoreDimensionCard
            title="Test Coverage & Maintainability"
            icon="🧪"
            dimension={result.scores.testing}
          />
          <ScoreDimensionCard
            title="Real-World Relevance & Usefulness"
            icon="🌍"
            dimension={result.scores.realWorldRelevance}
          />
          <ScoreDimensionCard
            title="Development & Commit Consistency"
            icon="📈"
            dimension={result.scores.developmentPractices}
          />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-blue-400" />
                Professional Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-slate-300 leading-relaxed">
                  {result.summary}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4 mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-purple-400" />
                Personalized Improvement Roadmap
              </CardTitle>
              <p className="text-sm text-slate-400">
                Actionable steps to enhance your repository quality, prioritized by impact
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.roadmap.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-slate-900/50 p-6 border border-slate-700/30"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <Badge variant={getPriorityColor(item.priority)} className="ml-4">
                      {item.priority} Priority
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-400">Action Items:</div>
                    <ul className="space-y-2">
                      {item.actionItems.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className="flex items-start gap-2 text-sm text-slate-300"
                        >
                          <span className="mt-1 text-blue-400">▸</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScoreDimensionCard({
  title,
  icon,
  dimension,
}: {
  title: string;
  icon: string;
  dimension: { score: number; maxScore: number; feedback: string[] };
}) {
  const percentage = (dimension.score / dimension.maxScore) * 100;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Score</span>
            <span className="text-lg text-white">
              {dimension.score}
              <span className="text-slate-400">/{dimension.maxScore}</span>
            </span>
          </div>
          <Progress value={percentage} className="h-2 bg-slate-700" />
          <p className="mt-1 text-sm text-slate-500">{percentage.toFixed(1)}%</p>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-slate-400">Feedback:</div>
          <ul className="space-y-1.5">
            {dimension.feedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1 text-xs">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function getScoreDescription(percentage: number): string {
  if (percentage >= 90) return 'Exceptional quality';
  if (percentage >= 75) return 'Strong performance';
  if (percentage >= 60) return 'Good foundation';
  if (percentage >= 40) return 'Room for improvement';
  return 'Needs significant work';
}
