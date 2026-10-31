# Lingder implementation handoff

Updated on 2026-10-31 (Asia/Hong_Kong).

## Current status

The approved v1 is implemented. Work is committed in focused changes on the independent `main` branch; no push or deployment was requested. Read `AGENTS.md` before further work. Existing approval covered the functions and components below.

Completed:

- Typed default-export kana/Zhuyin datasets and a shared deck registry, with 133 individually tracked cards including four optional historical kana.
- Pure random selection and queue reconciliation; Pinia settings, mastery, Undo, local-calendar daily sessions, and extra practice.
- Versioned localStorage recovery, mounted initialization, invalid-data and unavailable-storage warnings, and rollover on a timer/focus.
- Card stack with Pointer Events, all four swipe directions, reveal, arrow keys, equivalent buttons, mode selector, settings, mastered-card restore, completion, status announcements, and focus transitions.
- Lavender-and-ink light/dark theme; responsive desktop and portrait layouts; Noto Sans and Noto Serif JP/TC through Google/Nuxt Fonts; SVG favicon.
- English copy with existing locale fallback/routing preserved. No new packages, icon packs, dependency upgrades, accounts, audio, translations, or backend.
- Regression coverage for the existing theme helper. It now toggles from the resolved system appearance, avoids creating window-size listeners per click, and uses explicit API feature detection. The theme button waits until mount before rendering browser-specific attributes.

## Commit sequence

| Commit | Contents |
| --- | --- |
| `76cc313` | Earlier rename and coding conventions |
| `b48f61d` | Decks, contracts, registry, integrity tests |
| `0c87460` | Daily sessions, saved progress, utilities, store/composable tests |
| `6fb236e` | Swipe interface, settings, collection, completion, interaction tests |
| `fae4ce5` | Lavender theme, Noto typography, theme-helper fixes and tests |
| Final regression/documentation commit | Additional keyboard/gesture accessibility coverage, focus handling, favicon, current documentation; find with `git log -1` |

## Validation record

- `pnpm lint`: passed.
- `pnpm test:all`: passed, 53 tests across 9 project/file runs (unit, Chromium, WebKit).
- `pnpm exec tsc --noEmit -p .nuxt/tsconfig.app.json`: passed for TypeScript sources; this does not check Vue templates.
- `git diff --check`: passed.
- Live Nuxt checks: desktop 1440 × 1100, phone portrait 390 × 844, tablet portrait 768 × 1024; light/dark appearance, reduced motion, and no horizontal overflow in checked layouts.
- Chromium and WebKit: real captured mouse swipes in all four directions, persisted ratings after reload, Noto loading, historical kana and Zhuyin rendering, and clean runtime/hydration checks after the theme fix.
- Browser component tests cover cancellation/short drags, duplicate events, ignored secondary pointers/repeated keys, cleanup, all arrow directions, focus, reveal/reset, and accessible reading descriptions.
- Production build was intentionally not run: repository policy reserves it for before a requested push. No push or deployment occurred.

## Operational notes and boundaries

Run `pnpm dev` for the app. Storage key: `lingder.study.v1`. Progress is local to this browser; clearing site data removes it. Undo is transient to the current visit and is cleared by settings, restore, rollover, and starting a new extra batch. Extra practice can repeat prior cards but never duplicates within one batch. Changing settings returns to daily study while keeping today's completed work and extra total.

Tests remain standalone Vue tests. The explicit test boundary supplies Vue/Pinia/VueUse auto-imports; it does not boot Nuxt. The final live checks complement this boundary. No dedicated full Vue typecheck command is configured.

The production domain is still undecided; keep `SITE_URL` at the configurable localhost default until one is chosen. Audio, voiced kana/combinations, vocabulary, accounts, translations, and landscape mobile/tablet optimization remain deferred, as approved. No implementation work remains for the approved v1 scope.

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
- Update project naming, documentation, and metadata defaults to Lingder while leaving the production domain configurable. **Completed: naming, configurable metadata, feature documentation, and SVG favicon.**
- Update `AGENTS.md` to require Vue SFCs with TypeScript and no JSX/TSX, Vitest coverage for every custom production `.ts` function/composable, approval before adding icon packs, and Valibot for form validation. **These guide updates are completed.** Fixed-choice settings require no validation dependency initially.

### Validation

- Unit tests: dataset integrity; script/historical filtering; random selection; mastery exclusion/restoration; Undo; settings changes; daily rollover; reload recovery; extra practice; empty pools; and storage failures.
- Cover every custom production `.ts` function/composable, including the existing theme helper. Test public behavior rather than private state. Data-only/type/configuration modules do not require function tests solely because they use `.ts`, but datasets still need integrity tests.
- Retain standalone Vitest projects, supplying explicit Vue/Pinia setup and targeted Nuxt-boundary mocks where needed. Existing tests do not provide Nuxt runtime, auto-imports, plugins, or `#imports`; the test TypeScript configuration only supplies editor types/aliases. Check installed APIs before changing test integration.
- Browser tests in Chromium and WebKit: all four swipe directions, cancelled/short drags, duplicate-event prevention, reveal behavior, buttons, keyboard controls, and focus. Use `.ts` tests and Vue templates, with no JSX/TSX.
- Check the running Nuxt app at desktop, tablet portrait, and phone portrait sizes, including dark mode, reduced motion, and font rendering for historical kana and Zhuyin.
- Run `pnpm lint` and `pnpm test:all`. Preserve runtime requirements, dependency policies, and the repository's build-before-push workflow.
