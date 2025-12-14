import type {
  AnalysisResult,
  RepositoryData,
  CommitData,
  Scores,
} from "../types";

export async function analyzeRepository(
  url: string,
): Promise<AnalysisResult> {
  // Extract owner and repo from URL
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, "");

  // Fetch repository data
  const repoData = await fetchRepositoryData(owner, repoName);
  const commitData = await fetchCommitData(owner, repoName);

  // Analyze the repository
  const scores = analyzeScores(repoData, commitData);
  const overallScore = calculateOverallScore(scores);
  const maxScore = calculateMaxScore(scores);
  const skillLevel = determineSkillLevel(
    overallScore,
    maxScore,
  );
  const tier = determineTier(overallScore, maxScore);
  const summary = generateSummary(
    repoData,
    scores,
    overallScore,
    maxScore,
  );
  const roadmap = generateRoadmap(scores, repoData);

  return {
    repositoryName: `${owner}/${repoName}`,
    overallScore,
    maxScore,
    skillLevel,
    tier,
    scores,
    summary,
    roadmap,
  };
}

async function fetchRepositoryData(
  owner: string,
  repo: string,
): Promise<RepositoryData> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Repository not found. Please check the URL and ensure the repository is public.",
      );
    }
    if (response.status === 403) {
      throw new Error(
        "API rate limit exceeded. Please try again later.",
      );
    }
    throw new Error("Failed to fetch repository data");
  }

  const data = await response.json();

  // Fetch README
  let readme: string | null = null;
  try {
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: { Accept: "application/vnd.github.raw" },
      },
    );
    if (readmeResponse.ok) {
      readme = await readmeResponse.text();
    }
  } catch (e) {
    // README not available
  }

  // Fetch languages
  let languages: Record<string, number> = {};
  try {
    const languagesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
    );
    if (languagesResponse.ok) {
      languages = await languagesResponse.json();
    }
  } catch (e) {
    // Languages not available
  }

  return {
    name: data.name,
    description: data.description,
    language: data.language,
    languages,
    stars: data.stargazers_count,
    forks: data.forks_count,
    open_issues: data.open_issues_count,
    size: data.size,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pushed_at: data.pushed_at,
    has_wiki: data.has_wiki,
    has_issues: data.has_issues,
    has_projects: data.has_projects,
    license: data.license
      ? {
          name: data.license.name,
          url: data.license.url,
        }
      : null,
    readme,
    default_branch: data.default_branch,
  };
}

async function fetchCommitData(
  owner: string,
  repo: string,
): Promise<CommitData> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
    );

    if (!response.ok) {
      return { total_count: 0, commits: [] };
    }

    const commits = await response.json();

    return {
      total_count: commits.length,
      commits: commits.map((commit: any) => ({
        sha: commit.sha,
        commit: {
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            date: commit.commit.author.date,
          },
        },
      })),
    };
  } catch (e) {
    return { total_count: 0, commits: [] };
  }
}

function analyzeScores(
  repoData: RepositoryData,
  commitData: CommitData,
): Scores {
  return {
    codeQuality: analyzeCodeQuality(repoData, commitData),
    projectStructure: analyzeProjectStructure(repoData),
    documentation: analyzeDocumentation(repoData),
    testing: analyzeTesting(repoData),
    realWorldRelevance: analyzeRealWorldRelevance(repoData),
    developmentPractices: analyzeDevelopmentPractices(
      repoData,
      commitData,
    ),
  };
}

function analyzeCodeQuality(
  repoData: RepositoryData,
  commitData: CommitData,
) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 20;

  // Language usage
  if (repoData.language) {
    score += 3;
    feedback.push(
      `✓ Primary language identified: ${repoData.language}`,
    );
  } else {
    feedback.push("✗ No primary programming language detected");
  }

  // Multiple languages indicate complexity
  const languageCount = Object.keys(repoData.languages).length;
  if (languageCount > 1) {
    score += 2;
    feedback.push(
      `✓ Uses ${languageCount} programming languages, showing technical diversity`,
    );
  }

  // Repository activity
  const daysSinceUpdate = getDaysSince(repoData.updated_at);
  if (daysSinceUpdate < 30) {
    score += 5;
    feedback.push("✓ Recently updated (within last 30 days)");
  } else if (daysSinceUpdate < 90) {
    score += 3;
    feedback.push("⚠ Updated within last 90 days");
  } else {
    feedback.push(
      "✗ No recent updates - repository may be abandoned",
    );
  }

  // Commit quality analysis
  if (commitData.commits.length > 0) {
    const goodCommits = commitData.commits.filter(
      (c) =>
        c.commit.message.length > 10 &&
        !c.commit.message.startsWith("Update "),
    ).length;
    const commitQuality =
      (goodCommits / commitData.commits.length) * 100;

    if (commitQuality > 70) {
      score += 5;
      feedback.push(
        "✓ Good commit message quality (descriptive and meaningful)",
      );
    } else if (commitQuality > 40) {
      score += 3;
      feedback.push(
        "⚠ Commit messages could be more descriptive",
      );
    } else {
      score += 1;
      feedback.push(
        "✗ Poor commit message quality - use meaningful descriptions",
      );
    }
  }

  // Repository size indicates development effort
  if (repoData.size > 1000) {
    score += 3;
    feedback.push(
      "✓ Substantial codebase size indicating significant development",
    );
  } else if (repoData.size > 100) {
    score += 2;
    feedback.push("⚠ Moderate codebase size");
  } else {
    feedback.push(
      "✗ Small codebase - may lack comprehensive features",
    );
  }

  // License
  if (repoData.license) {
    score += 2;
    feedback.push(`✓ Licensed under ${repoData.license.name}`);
  } else {
    feedback.push(
      "✗ No license file - important for open source projects",
    );
  }

  return { score, maxScore, feedback };
}

function analyzeProjectStructure(repoData: RepositoryData) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 15;

  // Has clear description
  if (
    repoData.description &&
    repoData.description.length > 20
  ) {
    score += 4;
    feedback.push(
      "✓ Clear and descriptive project description",
    );
  } else if (repoData.description) {
    score += 2;
    feedback.push("⚠ Project description is too brief");
  } else {
    feedback.push(
      "✗ Missing project description - add one to explain the purpose",
    );
  }

  // Project features
  if (repoData.has_issues) {
    score += 3;
    feedback.push(
      "✓ Issues enabled for bug tracking and feature requests",
    );
  }

  if (repoData.has_wiki) {
    score += 2;
    feedback.push("✓ Wiki enabled for extended documentation");
  }

  if (repoData.has_projects) {
    score += 2;
    feedback.push("✓ Projects enabled for task management");
  }

  // Community engagement
  if (repoData.stars > 10) {
    score += 2;
    feedback.push(
      `✓ ${repoData.stars} stars - community interest demonstrated`,
    );
  } else if (repoData.stars > 0) {
    score += 1;
    feedback.push(
      `⚠ ${repoData.stars} stars - limited community engagement`,
    );
  } else {
    feedback.push(
      "✗ No stars - consider promoting the project",
    );
  }

  if (repoData.forks > 0) {
    score += 2;
    feedback.push(
      `✓ ${repoData.forks} forks - code is being reused`,
    );
  } else {
    feedback.push("⚠ No forks yet");
  }

  return { score, maxScore, feedback };
}

function analyzeDocumentation(repoData: RepositoryData) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 25;

  if (!repoData.readme) {
    feedback.push(
      "✗ README file is missing - this is critical for any repository",
    );
    feedback.push(
      "✗ Without README, potential users cannot understand the project",
    );
    return { score, maxScore, feedback };
  }

  const readmeLength = repoData.readme.length;

  // README existence and quality
  if (readmeLength > 2000) {
    score += 10;
    feedback.push("✓ Comprehensive README (2000+ characters)");
  } else if (readmeLength > 500) {
    score += 6;
    feedback.push(
      "⚠ Moderate README length - consider adding more details",
    );
  } else {
    score += 3;
    feedback.push(
      "✗ README is too brief - expand with setup, usage, and examples",
    );
  }

  // Check for common sections
  const readme = repoData.readme.toLowerCase();

  if (readme.includes("install") || readme.includes("setup")) {
    score += 3;
    feedback.push("✓ Installation/setup instructions included");
  } else {
    feedback.push("✗ Missing installation instructions");
  }

  if (readme.includes("usage") || readme.includes("example")) {
    score += 3;
    feedback.push("✓ Usage examples provided");
  } else {
    feedback.push("✗ No usage examples - add code samples");
  }

  if (
    readme.includes("contributing") ||
    readme.includes("contribution")
  ) {
    score += 2;
    feedback.push("✓ Contribution guidelines included");
  }

  if (readme.includes("license")) {
    score += 2;
    feedback.push("✓ License information in README");
  }

  // Visual elements
  if (readme.includes("![") || readme.includes("<img")) {
    score += 2;
    feedback.push(
      "✓ Includes images/screenshots for visual clarity",
    );
  } else {
    feedback.push("⚠ Consider adding screenshots or diagrams");
  }

  // Code blocks
  if (readme.includes("```") || readme.includes("`")) {
    score += 2;
    feedback.push("✓ Code examples formatted properly");
  }

  // Badges
  if (
    readme.includes("badge") ||
    readme.includes("shields.io") ||
    readme.includes("img.shields.io")
  ) {
    score += 1;
    feedback.push("✓ Status badges present");
  }

  return { score, maxScore, feedback };
}

function analyzeTesting(repoData: RepositoryData) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 15;

  // Note: Without file tree access, we estimate based on common patterns
  const readme = (repoData.readme || "").toLowerCase();

  // Check for testing mentions in README
  if (readme.includes("test") && readme.includes("coverage")) {
    score += 5;
    feedback.push("✓ Test coverage mentioned in documentation");
  } else if (readme.includes("test")) {
    score += 3;
    feedback.push("⚠ Testing mentioned but coverage unclear");
  } else {
    feedback.push("✗ No testing information in documentation");
  }

  // Check for CI/CD badges or mentions
  if (
    readme.includes("travis") ||
    readme.includes("circleci") ||
    readme.includes("github actions") ||
    readme.includes("build passing") ||
    readme.includes("workflow")
  ) {
    score += 5;
    feedback.push("✓ CI/CD pipeline detected");
  } else {
    feedback.push(
      "✗ No CI/CD pipeline detected - consider adding automated tests",
    );
  }

  // Check for common testing frameworks
  const testingFrameworks = [
    "jest",
    "mocha",
    "pytest",
    "junit",
    "rspec",
    "phpunit",
    "unittest",
  ];
  const hasTestFramework = testingFrameworks.some((fw) =>
    readme.includes(fw),
  );

  if (hasTestFramework) {
    score += 3;
    feedback.push("✓ Testing framework mentioned");
  }

  // Encourage testing
  if (score < 5) {
    feedback.push(
      "⚠ Consider adding unit and integration tests",
    );
    feedback.push("⚠ Set up automated testing with CI/CD");
    score += 2; // Base score for having a repo
  }

  return { score, maxScore, feedback };
}

function analyzeRealWorldRelevance(repoData: RepositoryData) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 10;

  // Community metrics
  if (repoData.stars > 100) {
    score += 4;
    feedback.push(
      "✓ Significant community interest (100+ stars)",
    );
  } else if (repoData.stars > 10) {
    score += 3;
    feedback.push("⚠ Moderate community interest");
  } else if (repoData.stars > 0) {
    score += 1;
    feedback.push("⚠ Limited community adoption");
  } else {
    feedback.push("✗ No community engagement yet");
  }

  // Active development
  const daysSinceUpdate = getDaysSince(repoData.pushed_at);
  if (daysSinceUpdate < 7) {
    score += 3;
    feedback.push("✓ Very recent activity (within 7 days)");
  } else if (daysSinceUpdate < 30) {
    score += 2;
    feedback.push("✓ Recent activity (within 30 days)");
  } else {
    feedback.push(
      "⚠ No recent commits - project may be stagnant",
    );
  }

  // Open issues management
  if (repoData.open_issues === 0) {
    score += 2;
    feedback.push("✓ No open issues - well maintained");
  } else if (repoData.open_issues < 10) {
    score += 1;
    feedback.push(`⚠ ${repoData.open_issues} open issues`);
  } else {
    feedback.push(
      `✗ ${repoData.open_issues} open issues - may need attention`,
    );
  }

  // Project maturity
  const daysSinceCreation = getDaysSince(repoData.created_at);
  if (daysSinceCreation > 365) {
    score += 1;
    feedback.push("✓ Mature project (over 1 year old)");
  } else if (daysSinceCreation > 90) {
    feedback.push("⚠ Relatively new project");
  } else {
    feedback.push("⚠ Very new project - still establishing");
  }

  return { score, maxScore, feedback };
}

function analyzeDevelopmentPractices(
  repoData: RepositoryData,
  commitData: CommitData,
) {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 15;

  // Commit consistency
  if (commitData.total_count > 50) {
    score += 5;
    feedback.push("✓ Strong commit history (50+ commits)");
  } else if (commitData.total_count > 10) {
    score += 3;
    feedback.push("⚠ Moderate commit history");
  } else if (commitData.total_count > 0) {
    score += 1;
    feedback.push(
      "✗ Limited commit history - needs more development",
    );
  }

  // Analyze commit dates for consistency
  if (commitData.commits.length >= 5) {
    const dates = commitData.commits.map((c) =>
      new Date(c.commit.author.date).getTime(),
    );
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(dates.length, 10); i++) {
      intervals.push(dates[i - 1] - dates[i]);
    }

    const avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const daysBetween = avgInterval / (1000 * 60 * 60 * 24);

    if (daysBetween < 14) {
      score += 3;
      feedback.push(
        "✓ Regular commit cadence (commits every 2 weeks or less)",
      );
    } else if (daysBetween < 30) {
      score += 2;
      feedback.push("⚠ Irregular commit pattern");
    } else {
      score += 1;
      feedback.push(
        "✗ Infrequent commits - establish a regular development schedule",
      );
    }
  }

  // Branch management (based on default branch name)
  if (
    repoData.default_branch === "main" ||
    repoData.default_branch === "master"
  ) {
    score += 2;
    feedback.push(
      `✓ Standard default branch name: ${repoData.default_branch}`,
    );
  }

  // Repository activity vs creation
  const daysSinceCreation = getDaysSince(repoData.created_at);
  const daysSinceUpdate = getDaysSince(repoData.updated_at);

  if (daysSinceUpdate < daysSinceCreation * 0.1) {
    score += 3;
    feedback.push(
      "✓ Actively maintained throughout its lifetime",
    );
  } else if (daysSinceUpdate < daysSinceCreation * 0.5) {
    score += 2;
    feedback.push("⚠ Some periods of inactivity");
  } else {
    feedback.push("✗ Long periods without updates");
  }

  // License for collaborative development
  if (repoData.license) {
    score += 2;
    feedback.push(
      "✓ Proper licensing encourages collaboration",
    );
  } else {
    feedback.push("✗ Add a license for legal clarity");
  }

  return { score, maxScore, feedback };
}

function calculateOverallScore(scores: Scores): number {
  return Object.values(scores).reduce(
    (sum, dimension) => sum + dimension.score,
    0,
  );
}

function calculateMaxScore(scores: Scores): number {
  return Object.values(scores).reduce(
    (sum, dimension) => sum + dimension.maxScore,
    0,
  );
}

function determineSkillLevel(
  score: number,
  maxScore: number,
): "Beginner" | "Intermediate" | "Advanced" | "Expert" {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 85) return "Expert";
  if (percentage >= 70) return "Advanced";
  if (percentage >= 50) return "Intermediate";
  return "Beginner";
}

function determineTier(
  score: number,
  maxScore: number,
): "Bronze" | "Silver" | "Gold" | "Platinum" {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return "Platinum";
  if (percentage >= 75) return "Gold";
  if (percentage >= 60) return "Silver";
  return "Bronze";
}

function generateSummary(
  repoData: RepositoryData,
  scores: Scores,
  overallScore: number,
  maxScore: number,
): string {
  const percentage = (overallScore / maxScore) * 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Identify strengths and weaknesses
  Object.entries(scores).forEach(([key, value]) => {
    const dimensionPercentage =
      (value.score / value.maxScore) * 100;
    const name = formatDimensionName(key);

    if (dimensionPercentage >= 70) {
      strengths.push(name);
    } else if (dimensionPercentage < 40) {
      weaknesses.push(name);
    }
  });

  let summary = `## Professional Repository Evaluation\n\n`;

  // Overall assessment
  if (percentage >= 80) {
    summary += `This repository demonstrates **excellent** software engineering practices with a score of **${overallScore}/${maxScore} (${percentage.toFixed(1)}%)**. `;
  } else if (percentage >= 65) {
    summary += `This repository shows **strong** development practices with a score of **${overallScore}/${maxScore} (${percentage.toFixed(1)}%)**. `;
  } else if (percentage >= 50) {
    summary += `This repository has a **solid foundation** with a score of **${overallScore}/${maxScore} (${percentage.toFixed(1)}%)**. `;
  } else {
    summary += `This repository has **significant room for improvement** with a score of **${overallScore}/${maxScore} (${percentage.toFixed(1)}%)**. `;
  }

  // Strengths
  if (strengths.length > 0) {
    summary += `The codebase excels in ${strengths.join(", ").toLowerCase()}`;
    summary +=
      strengths.length === 1
        ? ". "
        : ", demonstrating professional quality in these areas. ";
  }

  // Weaknesses
  if (weaknesses.length > 0) {
    summary += `However, there are notable gaps in ${weaknesses.join(", ").toLowerCase()}`;
    summary +=
      weaknesses.length === 1
        ? ". "
        : " that should be addressed. ";
  }

  // Specific insights
  summary += `\n\n### Key Observations\n\n`;

  if (repoData.readme && repoData.readme.length > 1000) {
    summary += `- **Documentation**: Comprehensive README provides clear project information\n`;
  } else if (!repoData.readme) {
    summary += `- **Documentation**: Missing README file is a critical issue that must be addressed immediately\n`;
  }

  if (
    scores.codeQuality.score / scores.codeQuality.maxScore >
    0.7
  ) {
    summary += `- **Code Quality**: Shows consistent development practices and meaningful commit history\n`;
  }

  if (scores.testing.score / scores.testing.maxScore < 0.4) {
    summary += `- **Testing**: Lacks visible testing infrastructure - implement automated tests and CI/CD\n`;
  }

  if (repoData.stars > 10 || repoData.forks > 5) {
    summary += `- **Community**: Gaining traction with ${repoData.stars} stars and ${repoData.forks} forks\n`;
  }

  const daysSinceUpdate = getDaysSince(repoData.updated_at);
  if (daysSinceUpdate > 90) {
    summary += `- **Activity**: Repository appears inactive (last updated ${daysSinceUpdate} days ago)\n`;
  } else if (daysSinceUpdate < 7) {
    summary += `- **Activity**: Actively maintained with recent updates\n`;
  }

  summary += `\n### Recommendation\n\n`;

  if (percentage >= 75) {
    summary += `This repository is well-positioned for professional use or portfolio inclusion. Focus on maintaining current standards while addressing any remaining gaps in ${weaknesses.length > 0 ? weaknesses.join(" and ").toLowerCase() : "minor areas"}.`;
  } else if (percentage >= 60) {
    summary += `The repository has strong potential but requires improvements in key areas. Prioritize enhancing ${weaknesses.length > 0 ? weaknesses[0].toLowerCase() : "weaker dimensions"} to meet professional standards.`;
  } else {
    summary += `Significant improvements are needed before this repository can be considered production-ready or portfolio-worthy. Start with the high-priority items in the roadmap below, focusing particularly on ${weaknesses.length > 0 ? weaknesses[0].toLowerCase() : "foundational improvements"}.`;
  }

  return summary;
}

function generateRoadmap(
  scores: Scores,
  repoData: RepositoryData,
) {
  const roadmap: Array<{
    priority: "High" | "Medium" | "Low";
    title: string;
    description: string;
    actionItems: string[];
  }> = [];

  // Documentation improvements
  if (
    scores.documentation.score / scores.documentation.maxScore <
    0.6
  ) {
    roadmap.push({
      priority: "High",
      title: "Enhance Documentation",
      description:
        "Comprehensive documentation is critical for project adoption and collaboration.",
      actionItems: [
        "Create or expand README with project overview, purpose, and key features",
        "Add installation and setup instructions with prerequisites",
        "Include usage examples and code samples",
        "Add screenshots or GIFs demonstrating functionality",
        "Document API or main interfaces",
        "Create CONTRIBUTING.md for collaboration guidelines",
      ],
    });
  }

  // Testing infrastructure
  if (scores.testing.score / scores.testing.maxScore < 0.5) {
    roadmap.push({
      priority: "High",
      title: "Implement Testing Strategy",
      description:
        "Testing is essential for code quality and maintainability in professional projects.",
      actionItems: [
        "Choose and set up appropriate testing framework for your language",
        "Write unit tests for core functionality (aim for 70%+ coverage)",
        "Add integration tests for critical workflows",
        "Set up CI/CD pipeline (GitHub Actions, Travis, CircleCI)",
        "Add test coverage reporting and badges",
        "Document how to run tests in README",
      ],
    });
  }

  // Code quality and structure
  if (
    scores.codeQuality.score / scores.codeQuality.maxScore <
    0.6
  ) {
    roadmap.push({
      priority: "High",
      title: "Improve Code Quality",
      description:
        "Clean, well-organized code demonstrates professional development practices.",
      actionItems: [
        "Establish consistent code formatting standards",
        "Add linting configuration (.eslintrc, .pylintrc, etc.)",
        "Write meaningful commit messages (use conventional commits)",
        "Refactor long functions into smaller, testable units",
        "Add code comments for complex logic",
        "Remove dead code and unused dependencies",
      ],
    });
  }

  // Project structure
  if (
    scores.projectStructure.score /
      scores.projectStructure.maxScore <
    0.6
  ) {
    roadmap.push({
      priority: "Medium",
      title: "Optimize Project Structure",
      description:
        "Well-organized projects are easier to navigate and maintain.",
      actionItems: [
        "Create clear folder structure (src/, tests/, docs/, etc.)",
        "Add .gitignore for language/framework-specific files",
        "Include LICENSE file if missing",
        "Enable GitHub Issues for bug tracking",
        "Add project description and topics/tags",
        "Create issue and PR templates",
      ],
    });
  }

  // Development practices
  if (
    scores.developmentPractices.score /
      scores.developmentPractices.maxScore <
    0.6
  ) {
    roadmap.push({
      priority: "Medium",
      title: "Establish Development Workflow",
      description:
        "Consistent development practices improve collaboration and code quality.",
      actionItems: [
        "Commit code regularly with meaningful messages",
        "Use feature branches for new development",
        "Implement code review process via pull requests",
        "Add CHANGELOG.md to track version history",
        "Consider semantic versioning for releases",
        "Set up branch protection rules",
      ],
    });
  }

  // Real-world relevance
  if (
    scores.realWorldRelevance.score /
      scores.realWorldRelevance.maxScore <
    0.5
  ) {
    roadmap.push({
      priority: "Low",
      title: "Increase Project Visibility and Impact",
      description:
        "Make your project discoverable and useful to others.",
      actionItems: [
        "Add relevant topics/tags to repository",
        "Share project on developer communities (Reddit, Hacker News, etc.)",
        "Write blog post or tutorial about the project",
        "Add project to awesome-lists or curated collections",
        "Engage with issues and feature requests promptly",
        "Consider creating a project website or demo",
      ],
    });
  }

  // Ensure we have at least one roadmap item
  if (roadmap.length === 0) {
    roadmap.push({
      priority: "Low",
      title: "Continue Excellence",
      description:
        "Maintain current high standards while exploring new improvements.",
      actionItems: [
        "Keep dependencies up to date",
        "Monitor and address security vulnerabilities",
        "Expand test coverage to 90%+",
        "Add performance benchmarks",
        "Consider internationalization (i18n)",
        "Explore advanced CI/CD features",
      ],
    });
  }

  return roadmap.slice(0, 5); // Return top 5 items
}

function formatDimensionName(key: string): string {
  const names: Record<string, string> = {
    codeQuality: "Code Quality",
    projectStructure: "Project Structure",
    documentation: "Documentation",
    testing: "Testing",
    realWorldRelevance: "Real-World Relevance",
    developmentPractices: "Development Practices",
  };
  return names[key] || key;
}

function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}