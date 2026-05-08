import { GoogleGenerativeAI } from "@google/generative-ai";
import { RepoData } from "./github";

export interface AnalysisResult {
  what: string;
  structure: string;
  entryPoints: string;
  whereYouLeftOff: string;
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

Global rules for your response:
- Maximum 5 points per section
- No repeating the same insight twice
- If unsure about something, say so explicitly
- Prefer bullet points over paragraphs
- Be surgical. Not documentary.
`;

  const modes: Record<string, string> = {
    explain: `
${base}

Your job: Explain this repository to a developer who has never seen it.
Answer these clearly:
1. What problem does this project solve?
2. Who would use it and why?
3. What is the core thing it does in one sentence?
4. What are the main moving parts?

Be direct. No fluff. Developer audience.
`,

    structure: `
${base}

Your job: Break down the folder and file structure.
For each important folder and file explain:
- What it contains
- Why it exists
- How important it is (core / supporting / config)

Skip obvious files like .gitignore, package-lock.json.
Be direct. No fluff.
`,

    entrypoints: `
${base}

Your job: Tell a developer exactly where to start reading this codebase.
Answer:
1. What is the single most important file to read first?
2. What are the top 3-5 files that matter most?
3. What is the execution flow from entry to core logic?
4. What can safely be ignored on first read?

Be direct. Give file names. No fluff.
`,

    whereyouleftoff: `
${base}

Your job: Help a developer pick up exactly where they left off.

Rules:
- Never say "this is incomplete" — say "this appears incomplete because [evidence]"
- Reference specific file names and code context as evidence
- Use confidence indicators: [HIGH] [MEDIUM] [LOW]
- Be concise. One insight per point. No repetition.

Answer:
1. What was being worked on most recently? (cite commit dates and messages as evidence)
2. What appears incomplete and WHY? (cite evidence — truncated code, missing methods, empty migrations)
3. What should they work on next? (ordered by priority)
4. Broken connections? (method called but not defined, migration empty despite enum change)
5. In one sentence: "You left off at..."

Be surgical. Not documentary.
`,
  };

  return modes[mode] || modes.explain;
}

async function reviewWhereYouLeftOff(
  model: any,
  analysis: string
): Promise<string> {
  const prompt = `
You are a senior engineer reviewing an AI-generated analysis of a codebase.

Here is the analysis:
${analysis}

Review it for these issues and fix them:
- [OVERCONFIDENT] Claims stated as fact without code evidence
- [REPEATED] Same insight mentioned more than once
- [UNVERIFIED] Assumptions presented as conclusions

Rules:
- Keep everything that is well-evidenced
- Soften overconfident claims with "appears to" or "suggests that"
- Remove repeated insights entirely
- Flag unverified assumptions with "(unverified — check manually)"
- Do NOT add new insights. Only clean existing ones.
- Keep the same structure and format.

Return the cleaned analysis only. No meta-commentary.
`;

  let result;
  let attempts = 0;

  while (attempts < 5) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (err: any) {
      if (
        err.message?.includes("429") ||
        err.message?.includes("503")
      ) {
        const wait = Math.pow(2, attempts) * 10000;
        console.log(` Reviewer waiting ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        attempts++;
      } else {
        throw err;
      }
    }
  }

  if (!result) return analysis;
  return result.response.text();
}

export async function analyzeRepo(
  repo: RepoData,
  apiKey: string
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  console.log(" Analyzing with Gemini...\n");

  const modes = ["explain", "structure", "entrypoints", "whereyouleftoff"];
  const labels = ["what", "structure", "entryPoints", "whereYouLeftOff"];
  const results: Partial<AnalysisResult> = {};

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const label = labels[i];
    console.log(` Running: ${mode}...`);

    await new Promise((r) => setTimeout(r, 6000));

    let result;
    let attempts = 0;

    while (attempts < 5) {
      try {
        result = await model.generateContent(buildPrompt(repo, mode));
        break;
      } catch (err: any) {
        if (
          err.message?.includes("429") ||
          err.message?.includes("503")
        ) {
          const wait = Math.pow(2, attempts) * 10000;
          console.log(` Rate limited. Waiting ${wait / 1000}s...`);
          await new Promise((r) => setTimeout(r, wait));
          attempts++;
        } else {
          throw err;
        }
      }
    }

    if (!result) throw new Error(`Failed after 5 attempts on mode: ${mode}`);

    let text = result.response.text();

    if (mode === "whereyouleftoff") {
      console.log(" Reviewing whereyouleftoff...");
      await new Promise((r) => setTimeout(r, 6000));
      text = await reviewWhereYouLeftOff(model, text);
    }

    (results as any)[label] = text;
  }

  return results as AnalysisResult;
}