# Agent guide for Lingder

## Project context

Lingder is an English-first language-learning web app with a dating-style flashcard interface. Its approved first release covers Japanese kana and Taiwan Zhuyin, with progress saved in localStorage. The first release is implemented with Nuxt 4, Vue 3, and TypeScript: typed decks, daily sessions, browser persistence, swipe/keyboard controls, settings, mastery, and Undo.

It has its own Git repository and must not import the source site's Git metadata, history, logs, or remotes.

Use `package.json`, `pnpm-lock.yaml`, and repository configuration as the source of truth. Preserve dependency versions and the declared Node/pnpm runtime requirements unless a task explicitly changes them.

Nuxt UI and Tailwind CSS supply the UI system. Enabled modules provide localization, color mode, fonts, icons, images, Pinia, and VueUse. Nuxt Content is installed but commented out. The approved visual direction is lavender and ink, with Google Noto Sans for interface text and language-appropriate Noto Serif families for flashcard characters, loaded through Nuxt Fonts. The palette, responsive layouts, and Google Noto font configuration are implemented.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/app.vue` | Nuxt UI provider, locale synchronization, document metadata, and route composition |
| `app/app.config.ts` | Application and Nuxt UI customization entry point |
| `app/pages/` | File-based routes; the homepage composes the study flow |
| `app/layouts/` | Page layouts; the default composes UHeader, UMain, and UFooter |
| `app/components/` | Reusable components; auto-imports use `pathPrefix: false` |
| `app/utils/` | Pure session/persistence helpers and the browser-dependent theme toggle |
| `app/data/` | Typed kana/Zhuyin arrays and the deck registry |
| `app/stores/` | Pinia settings, mastery, daily and extra-practice sessions |
| `app/composables/` | Mounted persistence/calendar and pointer-gesture lifecycles |
| `app/assets/css/` | Tailwind/Nuxt UI imports, reusable utilities, and functional transition styles |
| `app/i18n/` | Vue I18n configuration and locale JSON files |
| `public/` | Static assets |
| `nuxt.config.ts` | Modules, metadata, localization, and Vite integration |
| `vitest.config.ts` | Standalone unit and browser test projects |
| `tests/` | Unit, integration, and Chromium/WebKit interaction tests |
| `.agents/skills/` | Bundled agent skills retained with `skills-lock.json` |

Add reusable composables under `app/composables/`, Pinia stores under `app/stores/`, and Nitro endpoints under root-level `server/api/` when needed.

## Setup and commands

Use **pnpm only**. Follow `package.json` runtime and package manager settings. Put project settings in `pnpm-workspace.yaml`. Preserve its `allowBuilds`, trust policies, release-age exceptions, and package permissions; do not relax them to make an install pass.

- `pnpm install`: install dependencies and prepare Nuxt.
- `pnpm dev`: start development.
- `pnpm lint`, `pnpm lint:fix`, `pnpm lint:inspect`: lint, fix, or inspect ESLint.
- `pnpm test`, `pnpm test:run`: watch or run unit tests.
- `pnpm test:browser:install`: install Chromium and WebKit.
- `pnpm test:browser`, `pnpm test:browser:run`: watch or run browser tests.
- `pnpm test:all`: run both test projects once.
- `pnpm build`, `pnpm generate`, `pnpm preview`: production workflows.

Use `pnpm install --frozen-lockfile` in CI. Commit lockfile changes with intentional dependency changes. Dependency updaters can write files; do not run them as routine validation.

## Planning and approval

When requested to create a new function or component, present a plan covering behavior, affected files, interfaces, and validation, and wait for agreement before implementation. Revisions to existing functions or components do not require this approval unless requested. Existing user authorization and explicit task instructions take precedence.

Only commit when the user explicitly asks; do not commit automatically. When commits are requested, make focused commits rather than collecting the entire app into one commit. Include relevant tests with the behavior they verify, and validate each coherent change before committing.

## Vue, Nuxt, and TypeScript

- Use Composition API with `<script setup lang="ts">` and Vue templates. JSX and TSX are not supported; do not add JSX tooling or write JSX/TSX, including in tests. No Options API or explicit `any`; use concrete types or narrow `unknown`.
- Follow `eslint.config.mts`, which composes Nuxt, Antfu, and `@oliver139/eslint-config`. Its `vue.blockOrder: 'sf'` requires script, template, then style. Include empty blocks when creating components.
- Use two-space indentation, single quotes in scripts, and no semicolons. Use ESLint for formatting; do not introduce Prettier.
- Initially write opening-tag attributes on one line and let ESLint format them. Place `aria-*` attributes last, including bound attributes.
- Inspect resolved lint rules when unclear. Do not weaken lint rules or add broad suppressions to accommodate new code.
- Use Nuxt auto-imports in application code. Explicitly import external types and non-auto-imported exports. Component names must be unique across folders.
- Define typed props and emits, keep props immutable, and use events for child-to-parent updates.
- Keep components cohesive and extract meaningful independent behavior without adding forwarding-only abstractions.
- Default to `shallowRef`; use `ref` when deep reactivity is needed. Avoid `reactive`. Derive values with `computed` and use watchers for side effects.
- Use Pinia for shared state and `useState` for small SSR-hydrated shared values. Never keep request-specific state in module-level mutable refs.
- Prefer existing VueUse utilities and clean up listeners and effects. Guard browser APIs and preserve hydration safety.
- Nuxt color mode owns theme state and persistence. Preserve the native fade and immediate reduced-motion fallback. Do not add production debug logs.
- Pronunciation uses one lazily created native audio element per mounted card stack. Keep playback on demand, cancel it on card/gesture changes, and preserve the per-recording source/license manifest in `app/data/audio/`. Audio licensing is separate from the app MIT license.

## UI and localization

- Keep the root `UApp` provider and its Nuxt UI locale synchronized with the active i18n locale.
- Prefer Tailwind utilities and Nuxt UI component slots for layout and presentation; avoid custom CSS selectors and scoped style rules. Keep CSS for theme tokens, font configuration, and View Transition pseudo-elements.
- Use supported Nuxt UI APIs and Tailwind 4's CSS-first setup. Inspect installed types and generated themes as reference; do not edit generated files.
- Support keyboard navigation, visible focus, accessible names, light/dark mode, and reduced motion where relevant. Follow the approved lavender-and-ink visual direction.
- Use only the installed `bx`, `lucide`, and `ri` icon collections. Ask the user for confirmation before adding another icon pack.
- Load Google Noto fonts through Nuxt Fonts: sans-serif families for interface text and language-appropriate serif families for flashcard characters. Preserve Japanese and Traditional Chinese glyph coverage.
- Use Valibot when form validation is needed. Fixed-choice settings do not require a validation dependency by themselves.
- Active locales are English (`en`, default) and Traditional Chinese (`zh`, language `zh-Hant`). Japanese (`ja`) remains commented out in the Nuxt configuration with an empty locale file ready to enable.
- Put user-facing copy in locale files. Add English first and use English fallback until translations are requested.
- Use locale-aware links and preserve `prefix_and_default` routing unless the task changes it. Preserve reactive `useLocaleHead()` metadata.
- Public metadata uses `SITE_NAME`, `SITE_DESC`, `SITE_URL`, and `SITE_IMG`. Document safe examples in `.env.example`; keep local environment files ignored and never put secrets in public metadata.

## Testing and validation

- Review relevant files and the current diff before editing. Preserve unrelated work.
- Run `pnpm lint` after each task, including documentation changes. Use uncached ESLint after dependency or lint configuration changes.
- Run affected tests when behavior or test configuration changes. Do not claim typechecking passed based on lint or tests; no dedicated typecheck command is configured.
- Every custom production function or composable written in a `.ts` file must have meaningful Vitest coverage, including store actions and internal helpers through their public behavior. Add tests alongside new or changed behavior; the approved implementation also includes coverage for the existing theme helper. Data-only modules, type declarations, and framework configuration files do not require function tests merely because they use `.ts`.
- The unit project uses jsdom and Vue Test Utils. The browser project uses Playwright, Chromium, WebKit, and `vitest-browser-vue`. Test behavior through public APIs and accessible interactions rather than private component state.
- Use `*.browser.test.ts` or `*.browser.spec.ts` for browser tests; ordinary test files run only in the unit project. Vue wrappers and browser renders have automatic cleanup.
- These are standalone Vue tests with explicit imports. `tests/auto-imports.ts` supplies a narrow Vue/Pinia/VueUse boundary; Nuxt runtime, plugins, and `#imports` are not supplied. Add intentional Nuxt integration tooling when a task requires it.
- Build only before `git push`, and push only after a successful build. Report failed or unavailable checks accurately.
- Do not edit generated `.nuxt/`, `.output/`, `.data/`, or `node_modules/` files. Change sources and regenerate normally.
- Keep upgrades and unrelated refactors outside the task. Preserve the MIT license and required attribution.

## Skills

Relevant bundled skills are under `.agents/skills/`, and `skills-lock.json` records their installation sources. Prefer skills exposed by the current session when available; read the relevant guide and required references before using it. Do not assume developer-specific absolute paths.

Use Vue best practices for Vue work, Vue testing and Vitest guides for testing, and relevant Nuxt, Nuxt UI, i18n, Pinia, VueUse, pnpm, debugging, or server skills as needed. Bundled skills may target different major versions; verify version-specific APIs against installed packages. A bundled skill does not enable its module or authorize unrelated dependencies, framework migrations, or features.

Repository conventions and explicit user instructions take precedence over generic examples. Keep this guide aligned with intentional architecture and workflow changes.
