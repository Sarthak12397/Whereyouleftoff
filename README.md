# WhereYouLeftOff

> Stop pretending you remember what you were doing.

A CLI tool that analyzes any GitHub repository and tells you exactly
what the project does, how it's structured, and where you left off —
with a senior engineer reviewing the most critical section before
it reaches you.

---

## The Problem

You open a repo you haven't touched in 3 weeks.
You have no idea what was half-built, what was broken, what was next.
You spend 45 minutes reconstructing context.

WhereYouLeftOff reconstructs it in 30 seconds.

---

## What Makes It Different

Most repo tools give you folder summaries and generic blurbs.

This gives you:

- **Continuation points** — what was actively being built
- **Unfinished logic detection** — truncated code, missing methods
- **Broken connections** — method called but never defined
- **Migration inconsistencies** — schema changes that don't match code
- **Confidence scoring** — [HIGH] [MEDIUM] [LOW] on every insight
- **Reviewed output** — a second model checks the critical section
  for overconfident claims before it reaches you

That's repository state interpretation. Not documentation generation.

---

## The Four Modes

| Mode | What It Does |
|---|---|
| `explain` | What the project does, who uses it, core moving parts |
| `structure` | Every important file — what it contains, why it exists |
| `entrypoints` | Exact files to read first and full execution flow |
| `whereyouleftoff` | What's incomplete, what's broken, what's next |

---

## How It Works

```
1. Fetches repo tree and file contents via GitHub API
2. Runs 4 focused analyses via Gemini
3. Runs a reviewer pass on "whereyouleftoff" output
   — softens overconfident claims
   — removes repeated insights  
   — flags unverified assumptions
4. Prints everything clean to terminal
```

The reviewer model is not a gimmick.
It's a second Gemini call that reads the hero section output and:
- Flags `[OVERCONFIDENT]` claims stated as fact without evidence
- Removes `[REPEATED]` insights
- Marks `[UNVERIFIED]` assumptions with "(unverified — check manually)"

You get a cleaned, calibrated output. Not raw LLM confidence.

---

## Install

```bash
git clone https://github.com/yourusername/whereyouleftoff
cd whereyouleftoff
npm install
```

---

## Setup

Create a `.env` file in the root:

```
GEMINI_API_KEY=your_gemini_key_here
GITHUB_TOKEN=your_github_token_here
```

Get your free Gemini key: [aistudio.google.com](https://aistudio.google.com)

Get your GitHub token:
```
github.com → Settings → Developer Settings
→ Personal access tokens → Tokens (classic)
→ Generate new token → check public_repo
```

---

## Usage

```bash
npm start https://github.com/username/repo
```

### Example

```bash
npm start https://github.com/Sarthak12397/TransactionalBusinessAPI
```

---

## Example Output

```
WHAT IS THIS PROJECT
  It provides a C# API for managing business transactions
  with idempotency, state tracking, and automated retry
  and recovery mechanisms for handling processing failures.

FOLDER STRUCTURE
  Domain/          core   — Transaction entity + state machine
  Services/        core   — Business logic + orchestration
  Jobs/            core   — Hangfire retry + recovery jobs
  Controller/      core   — HTTP API surface
  Migrations/      config — EF Core schema history

WHERE TO START READING
  1. Program.cs              — wiring and bootstrap
  2. Domain/Transaction.cs   — the core entity
  3. Services/               — business logic
  4. Jobs/                   — background retry logic

WHERE YOU LEFT OFF
  [HIGH] You left off at updating the README, but
  TransactionsController.cs appears incomplete because
  the TransactionResponse mapping is truncated at
  "CreatedAt = transact".

  [HIGH] PermanentFail() appears to be missing from
  Transaction.cs because RetryTransactionJob.cs calls
  it but no such method exists in the domain model.

  [MEDIUM] Two migrations appear empty despite enum
  evolution (unverified — check manually).
```

---

## Architecture

```
src/
  github.ts     — fetches repo tree + file contents via GitHub API
  analyzer.ts   — builds prompts, calls Gemini, runs reviewer pass
  index.ts      — entry point, CLI args, output formatting
```

---

## Rate Limits

Uses Google Gemini free tier.
Includes exponential backoff on 429 and 503 errors automatically.
One run = 5 Gemini calls total.

If you hit limits: wait 60 seconds and run again.
Free tier resets per minute.

---

## Built With

- Node.js + TypeScript
- GitHub REST API
- Google Gemini API (gemini-2.5-flash)

---

## Why

Built for developers who context-switch, return to old projects,
or onboard into unknown codebases.

The goal is not to replace reading the code.
The goal is to get you back to productive in under a minute.

---

*Built by Sarthak Shrestha*
