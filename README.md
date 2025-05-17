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
