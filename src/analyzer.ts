import { AIProvider } from "./providers/provider.interface";
import { RepoData } from "./github";

export interface AnalysisResult {
  what: string;
  structure: string;
  entryPoints: string;
  whereYouLeftOff: string;
  reviewerNotes: string;
  providersUsed: string[];
}

function buildPrompt(repo: RepoData, mode: string): string {
  const filesSummary = repo.files
    .map((f) => `=== ${f.path} ===\n${f.content.slice(0, 1500)}`)
    .join("\n\n");

  const base = `
You are analyzing a GitHub repository called "${repo.name}".
Description: ${repo.description}
Primary language: ${repo.language}
Stars: ${repo.stars}
Last updated: ${repo.lastUpdated}

FILE STRUCTURE:
${repo.structure.join("\n")}

RECENT COMMITS:
${repo.recentCommits.join("\n")}

FILE CONTENTS:
${filesSummary}

Global rules:
- Maximum 5 points per section
- No repeating the same insight twice
- If unsure, say so explicitly
- Prefer bullet points over paragraphs
- Be surgical. Not documentary.
`;

  const modes: Record<string, string> = {
    explain: `
${base}
Your job: Explain this repository to a developer who has never seen it.
1. What problem does this project solve?
2. Who would use it and why?
3. What is the core thing it does in one sentence?
4. What are the main moving parts?
Be direct. No fluff. Developer audience.
`,

    structure: `
${base}
Your job: Break down the folder and file structure.
For each important file:
- What it contains
- Why it exists
- Importance: core / supporting / config
Skip .gitignore, package-lock.json, lock files.
`,

    entrypoints: `
${base}
Your job: Tell a developer exactly where to start reading.
1. Single most important file to read first
2. Top 3-5 files that matter most
3. Execution flow from entry to core logic
4. What can safely be ignored on first read
Give file names. No fluff.
`,

    whereyouleftoff: `
${base}
Your job: Help a developer pick up exactly where they left off.

Rules:
- Never say "this is incomplete" — say "appears incomplete because [evidence]"
- Use confidence: [HIGH] [MEDIUM] [LOW]
- One insight per point. No repetition.

1. What was worked on most recently? (cite commit dates + messages)
2. What appears incomplete and WHY? (truncated code, missing methods, empty migrations)
3. What to work on next? (ordered by priority)
4. Broken connections? (method called but missing, migration empty despite enum change)
5. One sentence: "You left off at..."
`,

    reviewer: `
You are a senior code reviewer checking an AI-generated repo analysis for quality.

Here is the analysis to review:
{ANALYSIS}

Check for:
1. Overconfident claims stated as fact without evidence → flag as [OVERCONFIDENT]
2. Repeated insights saying the same thing twice → flag as [REPEATED]
3. Guesses presented as certainties → flag as [UNVERIFIED]
4. Anything genuinely useful and well-evidenced → flag as [STRONG]

Be brief. Flag only real issues. If the analysis is clean, say "Analysis looks solid."
`,
  };

  return modes[mode] || modes.explain;
}

export async function analyzeRepo(
  repo: RepoData,
  mainProvider: AIProvider,
  reviewerProvider?: AIProvider
): Promise<AnalysisResult> {
  console.log(` Using: ${mainProvider.name}\n`);

  const modes = ["explain", "structure", "entrypoints", "whereyouleftoff"];
  const labels = ["what", "structure", "entryPoints", "whereYouLeftOff"];
  const results: Partial<AnalysisResult> = {};
  const providersUsed: string[] = [mainProvider.name];

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const label = labels[i];
    console.log(` Running: ${mode}...`);
    await new Promise((r) => setTimeout(r, 6000));

    const text = await mainProvider.generate(buildPrompt(repo, mode));
    (results as any)[label] = text;
  }

  // Reviewer — surgical. only on whereyouleftoff.
  const reviewer = reviewerProvider ?? mainProvider;
  if (reviewerProvider) providersUsed.push(reviewerProvider.name);

  console.log(` Running: reviewer (${reviewer.name})...`);
  await new Promise((r) => setTimeout(r, 6000));

  const reviewPrompt = buildPrompt(repo, "reviewer").replace(
    "{ANALYSIS}",
    results.whereYouLeftOff ?? ""
  );

  results.reviewerNotes = await reviewer.generate(reviewPrompt);
  results.providersUsed = providersUsed;

  return results as AnalysisResult;
}