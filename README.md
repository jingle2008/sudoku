## Sudoku Core Algorithms

### Running Tests

To run the unit tests for the Sudoku engine and generator:

```bash
npm run test
```

### Running Coverage

To generate a code coverage report for the core algorithms:

```bash
npm run coverage
```

The report will be output in the `coverage/` directory.

### Core Algorithm Implementation

The core Sudoku solving and puzzle generation logic is deduplicated and optimized for performance. Both the solver and generator use a shared bit-mask-based backtracking implementation in [`src/lib/sudoku/bitmaskSolver.ts`](src/lib/sudoku/bitmaskSolver.ts). This ensures maximum code reuse and maintainability.

- To modify or extend the core backtracking logic, update `bitmaskBacktrack` in `bitmaskSolver.ts`.
- For property-based and randomized tests, see [`src/lib/sudoku/bitmaskSolver.test.ts`](src/lib/sudoku/bitmaskSolver.test.ts).

### Deployment

The app deploys to Cloudflare Pages automatically on push to `main` via GitHub Actions (after CI passes).

**Setup:**

1. Create a Cloudflare Pages project named `sudoku` (or update the `--project-name` in `.github/workflows/ci.yml`).
2. Add these repository secrets in GitHub (Settings > Secrets and variables > Actions):
   - `CLOUDFLARE_API_TOKEN` — Create an API token in the [Cloudflare dashboard](https://dash.cloudflare.com/profile/api-tokens) with the **Cloudflare Pages: Edit** permission.
   - `CLOUDFLARE_ACCOUNT_ID` — Found on the Cloudflare dashboard overview page.

**Manual deploy:**

```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=sudoku
```
