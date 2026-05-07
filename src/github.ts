import https from "https";

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export interface RepoData {
  name: string;
  description: string;
  language: string;
  stars: number;
  lastUpdated: string;
  files: RepoFile[];
  structure: string[];
  recentCommits: string[];
}

function httpsGet(url: string, token?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "whereyouleftoff",
        Accept: "application/vnd.github.v3+json",
        ...(token && { Authorization: `token ${token}` }),
      },
    };

    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseGithubUrl(url: string): { owner: string; repo: string } {
  const cleaned = url
    .replace("https://github.com/", "")
    .replace("http://github.com/", "")
    .replace("github.com/", "")
    .replace(/\/$/, "");

  const parts = cleaned.split("/");

  if (parts.length < 2) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  return { owner: parts[0], repo: parts[1] };
}

const SKIP_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
  ".pdf", ".doc", ".docx",
  ".mp4", ".mp3", ".wav",
  ".lock", ".sum",
];

const SKIP_FOLDERS = [
  "node_modules", ".git", "dist", "build",
  ".next", "coverage", ".nyc_output",
  "vendor", "bin", "obj",
];

function shouldSkipFile(path: string): boolean {
  const lowerPath = path.toLowerCase();

  for (const folder of SKIP_FOLDERS) {
    if (lowerPath.includes(`${folder}/`)) return true;
  }

  for (const ext of SKIP_EXTENSIONS) {
    if (lowerPath.endsWith(ext)) return true;
  }

  return false;
}

export async function fetchRepoData(
  repoUrl: string,
  token?: string
): Promise<RepoData> {
  const { owner, repo } = parseGithubUrl(repoUrl);

  console.log(`\n Fetching ${owner}/${repo}...`);

  // 1. Repo metadata
  const metaRaw = await httpsGet(
    `https://api.github.com/repos/${owner}/${repo}`,
    token
  );
  const meta = JSON.parse(metaRaw);

  if (meta.message === "Not Found") {
    throw new Error(`Repo not found: ${owner}/${repo}`);
  }

  // 2. File tree
  const treeRaw = await httpsGet(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    token
  );
  const tree = JSON.parse(treeRaw);

  const allPaths: string[] = tree.tree
    .filter((f: any) => f.type === "blob")
    .map((f: any) => f.path);

  const structure = allPaths.slice(0, 80);

  // 3. Read important files
  const importantFiles = allPaths
    .filter((p) => !shouldSkipFile(p))
    .slice(0, 20);

  console.log(` Reading ${importantFiles.length} files...`);

  const files: RepoFile[] = [];

  for (const filePath of importantFiles) {
    try {
      const raw = await httpsGet(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        token
      );
      const parsed = JSON.parse(raw);

      if (parsed.encoding === "base64" && parsed.content) {
        const content = Buffer.from(
          parsed.content.replace(/\n/g, ""),
          "base64"
        ).toString("utf-8");

        if (content.length < 8000) {
          files.push({
            path: filePath,
            content,
            size: content.length,
          });
        }
      }
    } catch {
      // skip unreadable files silently
    }
  }

  // 4. Recent commits
  const commitsRaw = await httpsGet(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
    token
  );
  const commits = JSON.parse(commitsRaw);

  const recentCommits: string[] = Array.isArray(commits)
    ? commits.map(
        (c: any) =>
          `${c.commit?.author?.date?.slice(0, 10)} — ${c.commit?.message?.split("\n")[0]}`
      )
    : [];

  console.log(` Done. ${files.length} files loaded.\n`);

  return {
    name: meta.full_name,
    description: meta.description || "No description",
    language: meta.language || "Unknown",
    stars: meta.stargazers_count,
    lastUpdated: meta.updated_at?.slice(0, 10),
    files,
    structure,
    recentCommits,
  };
}