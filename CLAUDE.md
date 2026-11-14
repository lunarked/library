# Working on this repo

- Push changes straight to `main`. Do not open pull requests or ask before pushing; the owner has approved direct pushes.
- The site is published with GitHub Pages from `main` at https://lunarked.github.io/library/.
- New tools go in `tools/`, stories in `stories/`, Amazon FBA pages in `fba/`, e-scooter operations pages in `escooter/`, network planning pages in `planning/`. Workbook pages in `fba/`, `escooter/` and `planning/` are built from `fba/src/` (engine) and each folder's `src/specs/`: run `python3 fba/src/build.py`. Add each new page to `index.html` in its section.
- Never use em dashes in any page or text.
