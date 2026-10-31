# Lingder

An English-first language-learning app with a swipeable flashcard deck. Learn Japanese kana and Taiwan Zhuyin in small daily sessions, with progress saved in your browser.

Built with Nuxt 4, Vue 3, TypeScript, Nuxt UI, Tailwind CSS, and Pinia. The lavender-and-ink interface supports light/dark themes, desktop and portrait mobile/tablet layouts, keyboard controls, and reduced motion. Google Noto Sans and Noto Serif JP/TC load through Nuxt Fonts.

See [HANDOFF.md](HANDOFF.md) for the approved scope, implementation status, and validation record; [AGENTS.md](AGENTS.md) covers development conventions. This repository retains independent Git history from the template source.

## Setup

Use pnpm and the Node/pnpm versions declared in `package.json`. The runtime and package manager are downloaded automatically when needed.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Open [localhost:3000](http://localhost:3000). English is the default interface language. Traditional Chinese routes currently use English fallback; Japanese interface localization remains disabled. Study-language selection is independent of interface locale.

## Learning

- Japanese: 46 basic hiragana and 46 basic katakana, individually tracked. Choose either script or both; optionally include historical ゐ / ゑ / ヰ / ヱ. Voiced forms and combinations are deferred.
- Taiwan Zhuyin: 37 standard symbols with pinyin sound guides. These guides represent sounds, not necessarily standalone syllables (including ㄝ → ê and ㄩ → ü).
- Set a daily goal of 5, 10, or 20 cards per language. Readings can stay visible or appear on tap, Space, or Enter.
- Swipe left/right or use horizontal arrow keys for **Review later**. Swipe up/down or use vertical arrow keys for **Mastered**. Equivalent labeled buttons are provided. Focus the card before using its keyboard controls.
- Undo the latest rating during the current visit. The mastered collection restores individual characters to eligibility.
- Daily selections survive reloads. Days follow your device’s local calendar. Settings update remaining cards while preserving completed work; settings changes return extra practice to the daily session. Starting another batch or changing settings/collection clears Undo.
- Extra practice draws fresh random batches, can repeat earlier cards, and keeps a separate daily total. No batch contains duplicates. Small pools create smaller batches.

“Review later” means future random eligibility, not guaranteed next-day scheduling or spaced repetition. Mastery belongs to each card separately: あ and ア are independent.

## Saved progress

Settings, mastery, and sessions are stored under `lingder.study.v1` in localStorage. Storage is initialized after mounting to keep server rendering stable. Invalid or unsupported saved data starts fresh with a warning. Storage failures show a warning and allow study to continue in memory. Clearing site data removes progress; there is no account or cross-device synchronization.

Audio, vocabulary decks, accounts, translations, and landscape mobile/tablet optimization are outside v1.

## Structure

| Path | Responsibility |
| --- | --- |
| `app/data/` | Typed datasets and extensible deck registry |
| `app/utils/study/` | Selection, calendar, queue reconciliation, saved-data validation |
| `app/stores/study.ts` | Pinia state and study actions |
| `app/composables/` | Persistence/calendar lifecycle and Pointer Events |
| `app/components/study/` | Card, controls, settings, collection, mode selector, completion |
| `app/pages/index.vue` | Study-screen composition and status announcements |
| `app/assets/css/main.css` | Tailwind theme tokens, fonts, and View Transition styles |
| `app/i18n/locales/en.json` | Interface copy |

The root `UApp` stays synchronized with the active locale; reactive locale metadata and `prefix_and_default` routing are preserved. Nuxt Content remains disabled. Dependency and package trust policies are unchanged.

## Public metadata

Copy `.env.example` to `.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `SITE_NAME` | Document and social title | `Lingder` |
| `SITE_DESC` | Optional description | Empty |
| `SITE_URL` | Site origin and localization base URL | `http://localhost:3000` |
| `SITE_IMG` | Optional social image URL | Empty |

These values become public metadata; never put secrets in them. Local environment files are ignored. A Lingder SVG favicon is included. The production domain and social image remain configurable.

## Validation

```bash
pnpm lint
pnpm test:run
pnpm test:browser:install
pnpm test:browser:run
pnpm test:all
```

Vitest runs standalone Vue tests with explicit imports. The unit project uses jsdom and Vue Test Utils; browser tests use Playwright with Chromium and WebKit. `tests/auto-imports.ts` supplies only Vue/Pinia/VueUse globals used by application code. Nuxt runtime/plugins are not booted. UI tests stub Nuxt components at the boundary; live Nuxt checks supplement these tests.

Coverage includes dataset integrity, selection/filtering, session and storage recovery, settings, mastery, Undo, extra practice, rollover, storage failure, pointer directions/cancellation, reading reveal, keyboard interaction, and theme transitions. Every custom production TypeScript function/composable is exercised through public behavior. Browser files use `.browser.test.ts`; all other test files run in the unit project. Cleanup is automatic.

There is no dedicated full Vue typecheck script. `pnpm exec tsc --noEmit -p .nuxt/tsconfig.app.json` checks TypeScript sources using generated Nuxt types; it does not validate Vue templates.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm lint:fix` | ESLint fixes |
| `pnpm test` / `pnpm test:browser` | Watch unit / browser tests |
| `pnpm build` | Production build, required before a requested push |
| `pnpm generate` | Static output |
| `pnpm preview` | Preview production build |

Use frozen installs in CI. Preserve the package trust/build policies in `pnpm-workspace.yaml`; commit lockfile changes with intentional dependency changes.

## Dataset references

- [Japan Foundation kana charts](https://classroomresources.sydney.jpf.go.jp/resources/hiragana-katakana-game/)
- [Taiwan Ministry of Education phonetic-symbol manual](https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html)
- [Unicode hiragana](https://www.unicode.org/charts/PDF/U3040.pdf) and [katakana](https://www.unicode.org/charts/PDF/U30A0.pdf) code charts

## License

MIT. See `LICENSE` for retained copyright and attribution.
