# Lingder implementation handoff

Prepared on 2026-10-31 (Asia/Hong_Kong).

## Start here

- Read `AGENTS.md` before implementation. It is the source of repository conventions.
- The user approved the plan below and explicitly requested focused commits during coding, rather than one commit containing the whole app. That approval already covers the planned functions and components; do not request the same approval again.
- The latest request was to rename the project to Lingder and create this handoff so another model can continue. This handoff turn deliberately stops before implementing learning features.
- Working directory: `/Users/oliver139/Code/flashcards`. The directory name is unchanged; the package and application name are now Lingder.
- Existing Git repository and branch: `main`. Preserve its independent history and unrelated changes. No push or deployment has been requested.

## Current progress

### Completed

- Reviewed the directory, `AGENTS.md`, application shell, Nuxt configuration, localization, package/runtime settings, lint configuration, and standalone Vitest projects.
- Agreed on the product name **Lingder**, the lavender-and-ink design, and the learning behavior documented below.
- Renamed the package to `lingder`; changed the public site-name fallback and `.env.example` to `Lingder`; updated the README and agent-guide identity.
- Recorded the approved requirements in `AGENTS.md`: Vue templates with TypeScript and no JSX/TSX, meaningful Vitest coverage for custom production `.ts` functions/composables, the three allowed icon packs, Google Noto fonts through Nuxt Fonts, Valibot for form validation, and incremental commits.
- Committed the rename and coding conventions as `76cc313` (`chore: rename project to Lingder and record coding conventions`).
- Added this handoff as a separate documentation change. Find its commit with `git log -1 -- HANDOFF.md`; its own hash is intentionally not embedded here.

### Actual application state

- The homepage remains empty (`app/pages/index.vue`). No datasets, learning components, learning stores/composables, daily-session logic, persistence, or mastery controls have been implemented.
- `app/app.config.ts` remains empty; the lavender-and-ink theme and Noto font configuration are not implemented.
- `app/app.vue` already wraps the app in `UApp`, synchronizes its Nuxt UI locale, and uses reactive `useLocaleHead()` metadata. Preserve this shell.
- The default layout supplies a main landmark. Existing `HiddenRow`, `ThemeToggler`, and `app/utils/view-transition.client.ts` are available. The theme helper has no dedicated test yet.
- English and Traditional Chinese are configured with English fallback and `prefix_and_default` routing. English currently contains only theme-switch copy; Traditional Chinese and Japanese locale JSON files are empty, and Japanese is commented out in Nuxt configuration.
- Nuxt UI, Tailwind, Pinia, VueUse, fonts, icons, images, localization, and color mode are available. Nuxt Content remains disabled. There is no learning backend.
- Dependencies and generated Nuxt types are available in this checkout. The declared toolchain was verified: pnpm `12.16.1`, Node `v26.13.0`. Preserve package versions, the lockfile, and workspace trust/build policies.
- Valibot is not a direct dependency. Do not depend on its transitive presence; add it intentionally only if validated forms are introduced. Fixed-choice settings need no validation library.

### Validation completed in this handoff turn

- `pnpm lint`: passed for the rename, guide, and handoff documentation changes.
- `pnpm test:run`: passed, 1 test file and 2 starter unit tests. These verify the empty homepage and default layout, not any planned learning functionality.
- `git diff --check`: passed for the rename and handoff changes; staged whitespace validation is also required before the handoff commit.
- Browser tests, typechecking, and a production build were not run. There is no dedicated typecheck script. Repository policy reserves production builds for before a push.

## Approved plan: Lingder v1

### Summary

Build an English-first language-learning app with a dating-style flashcard interface, lavender-and-ink styling, and progress saved in the browser.

The first release covers Japanese kana and Taiwan Zhuyin. It supports desktop and portrait tablet/phone layouts. Audio, vocabulary decks, accounts, and translations come later. Landscape tablet/phone optimization is outside the first release.

The original request's “Taiwan 注文” means **注音 / Zhuyin (Bopomofo)**. Use the standard spelling **katakana**, rather than “katagana.” Study-mode selection is separate from the app's interface locale.

### Learning experience

| Setting | Options | Default |
| --- | --- | --- |
| Study mode | Japanese / Taiwan Zhuyin | Japanese |
| Japanese scripts | Hiragana / Katakana / Both | Both |
| Historical kana | Include / Exclude | Exclude |
| Daily goal, per mode | 5 / 10 / 20 cards | 10 |
| Reading display | Always visible / Tap to reveal | Always visible |

- Show a stacked deck with one active card, its script label, reading, and session progress.
- Swipe **left or right**: “Review later.” Finish the current card and keep it eligible for future sessions. Both horizontal directions have the same meaning.
- Swipe **up or down**: “Mastered.” Exclude that individual card from future sessions until restored. Both vertical directions have the same meaning.
- Provide equivalent labeled buttons, arrow-key controls, and Space/Enter to reveal hidden readings.
- Include Undo for the latest rating and a mastered-card collection with individual restore actions.
- After the daily goal, show a completion screen with optional extra practice.

Daily selections persist across reloads. Each mode has independent progress, and days follow the device's local calendar. Settings changes immediately update remaining cards while retaining today's completed work. Raising the goal adds cards; lowering it below completed progress finishes the daily session.

Extra practice uses fresh random batches, may repeat cards studied earlier that day, and keeps its count separate from the daily goal. No batch contains duplicate cards. Small pools produce smaller batches; an exhausted pool shows a completion state. “Review later” means future random eligibility, not a guaranteed next-day appearance or a spaced-repetition algorithm.

### Data and state

- Create typed, default-export arrays (`export default [...]`) in `app/data/ja/hiragana.ts`, `app/data/ja/katakana.ts`, and `app/data/tw/phonetic.ts`.
- Include 46 basic characters per Japanese script, with optional historical **ゐ / ゑ / ヰ / ヱ**. Voiced forms and combinations are deferred.
- Include the 37 standard Zhuyin symbols. Readings use romaji for Japanese and pinyin guides for Zhuyin. Pronunciation audio is deferred.
- Define a shared card interface with stable `id`, `prompt`, `reading`, and optional historical flag. A typed deck registry supplies mode, script, language, and display metadata so future decks can reuse the learning flow, including word prompts later.
- Keep mastery independent for every character: mastering あ does not master ア.
- Use Pinia as the owner of settings, mastery, and sessions. Keep selection and queue calculations in pure utilities; isolate persistence/calendar behavior and pointer gestures in focused composables.
- Persist versioned state in localStorage. Initialize browser state after mounting, with a stable loading placeholder. Handle invalid saved data and unavailable storage without crashing; explain when progress cannot be saved.

### Interface and repository changes

- Compose the study screen from focused components for mode selection, card gestures, rating controls, settings, mastered cards, and completion.
- Use a centered deck on desktop and a compact layout on portrait devices. Include light/dark themes, visible focus, accessible status announcements, and reduced-motion behavior.
- Implement gestures with Pointer Events and VueUse utilities for listeners and cleanup. Short drags return the card; cancelled gestures do not rate it; each completed gesture commits once.
- Configure Google fonts through Nuxt Fonts: Noto Sans for interface text and Noto Serif JP / TC for card characters, with language-appropriate families and `lang` attributes. Check historical kana and Zhuyin coverage, and avoid Latin-only font subsets.
- Use only `bx`, `lucide`, and `ri` icons. Obtain user confirmation before adding another icon pack.
- Put interface copy in English locale keys. Preserve English fallback, locale-aware routing, and the synchronized `UApp` provider. Traditional Chinese and Japanese translations remain deferred until requested.
- Update project naming, documentation, and metadata defaults to Lingder while leaving the production domain configurable. **Naming/default metadata are completed; feature documentation and final branding assets remain part of implementation as needed.**
- Update `AGENTS.md` to require Vue SFCs with TypeScript and no JSX/TSX, Vitest coverage for every custom production `.ts` function/composable, approval before adding icon packs, and Valibot for form validation. **These guide updates are completed.** Fixed-choice settings require no validation dependency initially.

### Validation

- Unit tests: dataset integrity; script/historical filtering; random selection; mastery exclusion/restoration; Undo; settings changes; daily rollover; reload recovery; extra practice; empty pools; and storage failures.
- Cover every custom production `.ts` function/composable, including the existing theme helper. Test public behavior rather than private state. Data-only/type/configuration modules do not require function tests solely because they use `.ts`, but datasets still need integrity tests.
- Retain standalone Vitest projects, supplying explicit Vue/Pinia setup and targeted Nuxt-boundary mocks where needed. Existing tests do not provide Nuxt runtime, auto-imports, plugins, or `#imports`; the test TypeScript configuration only supplies editor types/aliases. Check installed APIs before changing test integration.
- Browser tests in Chromium and WebKit: all four swipe directions, cancelled/short drags, duplicate-event prevention, reveal behavior, buttons, keyboard controls, and focus. Use `.ts` tests and Vue templates, with no JSX/TSX.
- Check the running Nuxt app at desktop, tablet portrait, and phone portrait sizes, including dark mode, reduced motion, and font rendering for historical kana and Zhuyin.
- Run `pnpm lint` and `pnpm test:all`. Preserve runtime requirements, dependency policies, and the repository's build-before-push workflow.

## Remaining tasks and commit strategy

Implement the approved plan in coherent, reviewable commits. The user explicitly rejected collecting all implementation into a single final commit. Keep tests in the same commit as the behavior they verify; add browser coverage as interactions are implemented, rather than deferring every test until the end.

| Order | Suggested commit | Contents and acceptance |
| --- | --- | --- |
| Done | `chore: rename project to Lingder and record coding conventions` | Commit `76cc313`; package/application naming, metadata example/default, README, and agent conventions. |
| Handoff | `docs: add approved Lingder implementation handoff` | This file, README discovery link, and handoff validation. No learning features. |
| 1 | `feat: add kana and Zhuyin study decks` | Typed card/deck contracts, registry, three local data modules, historical flags, verified readings, and dataset integrity tests. |
| 2 | `feat: add daily study sessions and saved progress` | Pinia state, random queues, local-calendar rollover, settings updates, extra practice, mastery/Undo/restore, resilient localStorage, and meaningful utility/store/composable tests. Split further if needed for reviewability. |
| 3 | `feat: add swipe-based study interface` | Card stack, Pointer Events, accessible controls, mode selector, settings, mastered list, completion view, English copy, and interaction tests. Use focused commits within this stage if gestures, settings, or collection become substantial independent changes. |
| 4 | `feat: style Lingder with Noto fonts and lavender theme` | Nuxt Fonts, semantic UI tokens, desktop/portrait layouts, light/dark appearance, reduced-motion behavior, and visual checks. Styling may accompany earlier UI commits when necessary to keep them usable. |
| 5 | `test: complete Lingder browser and regression coverage` | Remaining Chromium/WebKit scenarios, theme-helper coverage if not already added, full regression checks, documentation/status refresh, and fixes supported by observed failures. Do not create a ceremonial commit if all coverage was completed earlier. |

For each commit:

1. Inspect the current diff and preserve unrelated work. Read relevant repository/session skills before implementing Vue, Nuxt UI, VueUse, Pinia, or test changes. Some bundled guides target newer majors; installed types and package versions are authoritative.
2. Implement one coherent change and its relevant tests. Follow script/template/style ordering, include empty SFC blocks, and use Nuxt auto-imports in application code as required by `AGENTS.md`.
3. Run `pnpm lint`, affected tests, and `git diff --check`. Use uncached ESLint after dependency or lint-configuration changes. Resolve failures without weakening rules.
4. Review and commit the validated change. Record any unavailable checks accurately.
5. At completion, run `pnpm test:all`, perform the responsive/manual checks above, and update the README, `AGENTS.md` current-state descriptions, and this handoff so they no longer describe an empty template.

Build only before a requested `git push`, and push only after a successful build. Do not deploy, purchase/register a domain, change icon packs, enable deferred translations, or upgrade unrelated dependencies as part of this handoff.

## Useful references

- [Taiwan MOE phonetic-symbol manual](https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html)
- [Japan Foundation kana teaching charts](https://classroomresources.sydney.jpf.go.jp/resources/hiragana-katakana-game/) (includes additional forms beyond the selected v1 scope)
- [Unicode hiragana chart](https://www.unicode.org/charts/PDF/U3040.pdf) and [katakana chart](https://www.unicode.org/charts/PDF/U30A0.pdf) for codepoints, including historical kana
- [Noto language-family guidance](https://notofonts.github.io/noto-docs/website/use/)
- [Nuxt Fonts configuration](https://fonts.nuxt.com/get-started/configuration) (verify options against installed `@nuxt/fonts` `0.14.0`)

The production domain is undecided. A prior check on 2026-10-31 found `lingder.com` registered and no registry record for `lingder.app`; that finding can change and does not establish trademark clearance. No domain was registered or configured. Keep `SITE_URL` configurable and its example/default at localhost until the user selects a production origin.
