# Sudoku

A feature-rich, mobile-friendly Sudoku puzzle game built with SvelteKit.

**[Play now → sudoku-enn.pages.dev](https://sudoku-enn.pages.dev)**

<!-- TODO: screenshot -->

## Features

- **6 difficulty levels** — Easy, Medium, Hard, Expert, Master, Extreme
- **Bitmask-powered solver** — MRV heuristic with backtracking for fast generation and validation
- **Solve log** — step-by-step strategy log with click-to-highlight cells
- **Pencil / pen modes** — toggle between placing values and taking notes
- **Long-press notes** — tap-and-hold on mobile to enter a note directly
- **Dark mode** — system-aware with manual toggle
- **Keyboard shortcuts** — full keyboard navigation and input
- **Web Worker generation** — puzzles generate in a background thread, keeping the UI responsive
- **Game statistics** — per-difficulty tracking of games played, completed, best time, and streaks
- **Celebration animation** — confetti on puzzle completion with best-time detection
- **Move history** — full undo/redo with undo-to-step from the move log
- **Auto-notes & strategies** — apply naked singles, naked pairs, and auto-candidate notes

## Tech Stack

- **SvelteKit** + **TypeScript**
- **Tailwind CSS** v4
- **Cloudflare Pages**

## Quick Start

```bash
git clone <repo-url>
cd sudoku-polish
npm install
npm run dev
```

## Testing

```bash
npm run test          # unit tests
npm run coverage      # coverage report → coverage/
```

## Deployment

The app auto-deploys to Cloudflare Pages on push to `main` via GitHub Actions.

**Manual deploy:**

```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=sudoku
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.

## Architecture

```
src/lib/
├── stores/          # Svelte stores
│   ├── gameStore    — grid state, cell selection, input, undo/redo, completion
│   ├── timerStore   — elapsed time with pause/resume and visibility handling
│   ├── statsStore   — per-difficulty stats persisted to localStorage
│   ├── historyStore — undo/redo stacks and move log
│   ├── solveLogStore— strategy step log with cell highlighting
│   └── themeStore   — dark/light theme with system preference detection
├── sudoku/          # Solver engine
│   ├── bitmaskSolver— generic bitmask backtracking (shared by solver + generator)
│   ├── engine       — placement validation, legal values, unique solution check
│   ├── solverStrategies — naked singles, naked pairs, note elimination
│   └── puzzleGenerator  — difficulty-based puzzle generation
└── workers/
    └── puzzleWorker — Web Worker for non-blocking puzzle generation
```

## License

MIT
