import * as dotenv from "dotenv";
import { fetchRepoData } from "./github";
import { analyzeRepo } from "./analyzer";

dotenv.config();

function printSection(title: string, content: string) {
  console.log("\n" + "═".repeat(60));
  console.log(` ${title}`);
  console.log("═".repeat(60));
  console.log(content);
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing in .env");
    process.exit(1);
  }

  const repoUrl = process.argv[2];

  if (!repoUrl) {
    console.error("❌ Usage: npm start <github-url>");
    console.error("❌ Example: npm start https://github.com/user/repo");
    process.exit(1);
  }

  try {
    const repo = await fetchRepoData(repoUrl, process.env.GITHUB_TOKEN);
    const analysis = await analyzeRepo(repo, apiKey);

    console.log("\n");
    console.log("██╗    ██╗██╗  ██╗███████╗██████╗ ███████╗");
    console.log("██║    ██║██║  ██║██╔════╝██╔══██╗██╔════╝");
    console.log("██║ █╗ ██║███████║█████╗  ██████╔╝█████╗  ");
    console.log("██║███╗██║██╔══██║██╔══╝  ██╔══██╗██╔══╝  ");
    console.log("╚███╔███╔╝██║  ██║███████╗██║  ██║███████╗");
    console.log(" ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝");
    console.log("        Y O U   L E F T   O F F            ");
    console.log("\n");
    console.log(` Repo: ${repo.name}`);
    console.log(` Language: ${repo.language}`);
    console.log(` Last updated: ${repo.lastUpdated}`);
    console.log(` Stars: ${repo.stars}`);

    printSection("WHAT IS THIS PROJECT", analysis.what);
    printSection("FOLDER STRUCTURE", analysis.structure);
    printSection("WHERE TO START READING", analysis.entryPoints);
    printSection("WHERE YOU LEFT OFF ←", analysis.whereYouLeftOff);

    console.log("\n" + "═".repeat(60));
    console.log(" Done. Go build.");
    console.log("═".repeat(60) + "\n");

  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();