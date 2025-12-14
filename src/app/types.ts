export interface RepositoryData {
  name: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  open_issues: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  has_wiki: boolean;
  has_issues: boolean;
  has_projects: boolean;
  license: {
    name: string;
    url: string;
  } | null;
  readme: string | null;
  default_branch: string;
}

export interface CommitData {
  total_count: number;
  commits: Array<{
    sha: string;
    commit: {
      message: string;
      author: {
        name: string;
        date: string;
      };
    };
  }>;
}

export interface ScoreDimension {
  score: number;
  maxScore: number;
  feedback: string[];
}

export interface Scores {
  codeQuality: ScoreDimension;
  projectStructure: ScoreDimension;
  documentation: ScoreDimension;
  testing: ScoreDimension;
  realWorldRelevance: ScoreDimension;
  developmentPractices: ScoreDimension;
}

export interface AnalysisResult {
  repositoryName: string;
  overallScore: number;
  maxScore: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  scores: Scores;
  summary: string;
  roadmap: RoadmapItem[];
}

export interface RoadmapItem {
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  actionItems: string[];
}
