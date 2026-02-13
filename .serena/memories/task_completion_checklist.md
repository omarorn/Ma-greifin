# Task Completion Checklist

When finishing a coding task in this project:

1. Run `npm run build` to catch integration/type/bundling issues.
2. Run `npm run dev` and perform manual smoke checks for affected gameplay paths.
3. Verify API-key-dependent paths still behave correctly when key is present/absent.
4. Check that era/theme-specific UI (`1920` vs `2020`) still renders correctly for changed components.
5. Review diff for unintended game-balance or text regressions in constants/rules.
6. Summarize any behavior changes clearly (especially if game mechanics changed).

Notes:
- There is no automated test suite or lint script configured right now; manual verification is currently required.