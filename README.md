# WhereYouLeftOff

> Stop pretending you remember what you were doing.

A CLI tool that analyzes any GitHub repository and tells you:
- What the project does
- How it's structured  
- Where to start reading
- **Exactly where you left off**

## The Problem

You open a repo you haven't touched in 3 weeks.  
You have no idea what was half-built, what was broken, what was next.  
You spend 45 minutes reconstructing context.

WhereYouLeftOff reconstructs it in 30 seconds.

## What Makes It Different

Most repo tools give you folder summaries and generic blurbs.

This gives you:
- **Continuation points** — what was actively being built
- **Unfinished logic detection** — truncated code, missing methods
- **Broken connections** — method called but never defined
- **Migration inconsistencies** — schema changes that don't match code
- **Probable next actions** — ordered by priority

That's repository state interpretation. Not documentation generation.

## Install

```bash
git clone https://github.com/yourusername/whereyouleftoff
cd whereyouleftoff
npm install
```

## Setup

Create a `.env` file:

```
GEMINI_API_KEY=your_gemini_key_here
GITHUB_TOKEN=your_github_token_here
```

Get your free Gemini key: [aistudio.google.com](https://aistudio.google.com)  
Get your GitHub token: [github.com/settings/tokens](https://github.com/settings/tokens)

## Usage

```bash
npm start https://github.com/username/repo
```

## Output

```
WHAT IS THIS PROJECT
  What it does, who uses it, core moving parts

FOLDER STRUCTURE  
  Every important file — what it contains, why it exists

WHERE TO START READING
  The exact files to read first and execution flow

WHERE YOU LEFT OFF
  What's incomplete, what's broken, what's next
  With confidence scoring and evidence citations
```
## Status
Status
Early prototype / active development
WhereYouLeftOff is currently an experimental GitHub repository analysis tool.
It is not production-ready yet.
The current prototype can:


analyze repository structure


inspect execution flow


detect likely unfinished work


identify broken or missing implementation links


generate probable continuation points


Many parts of the analysis system are still evolving:


repository parsers


heuristic scoring


dependency tracing


intent reconstruction


confidence ranking


The project is focused on validating a core idea:

Can AI infer repository state and unfinished developer intent directly from a codebase?

The long-term vision is a tool that helps developers return to old repositories and immediately understand:


what was being built


what broke


what remains incomplete


and what should happen next.
## Built With

- Node.js + TypeScript
- GitHub REST API
- Google Gemini API

## Why

Built as a developer tool for developers who context-switch,  
return to old projects, or onboard into unknown codebases.


