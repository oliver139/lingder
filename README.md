# Lingder

Lingder is a planned language-learning web app with a dating-style flashcard interface. The first release will cover Japanese kana and Taiwan Zhuyin, with progress saved in the browser.

The repository currently contains the blank Nuxt 4 template; the learning features have not been implemented yet. The template was derived from the development setup of `oliver-personal-site`, with independent Git history.

## Setup

Use pnpm and the Node/pnpm versions declared in `package.json`. The runtime and package manager are downloaded automatically when needed.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Open `http://localhost:3000`. The homepage intentionally has no visible content.

## Included

- Nuxt 4, Vue 3, TypeScript, Nuxt UI, and Tailwind CSS.
- Nuxt modules for fonts, icons, images, color mode, Pinia, and VueUse.
- English and Traditional Chinese localization with English fallback and `prefix_and_default` routing.
- A commented Japanese locale in `nuxt.config.ts`; uncomment it to enable the retained empty locale file.
- Nuxt Content and SQLite dependencies, with the Content module left disabled.
- ESLint, VS Code settings, dependency updater configurations, and bundled agent skills.
- Reusable `HiddenRow` and `ThemeToggler` components and a theme-transition helper, available without appearing on the homepage.

There is no custom palette, font selection, page decoration, or component theme. Tailwind utilities and functional theme-transition styles remain available.

## Customization

Start with `app/pages/index.vue` and `app/layouts/default.vue`. Add UI customization in `app/app.config.ts` and global CSS in `app/assets/css/main.css`.

The root application keeps the Nuxt UI provider synchronized with the active locale and supplies locale-aware document metadata.

Copy `.env.example` to `.env` to customize the public site metadata:

| Variable | Purpose | Default |
| --- | --- | --- |
| `SITE_NAME` | Document and social title | `Lingder` |
| `SITE_DESC` | Optional description | Empty |
| `SITE_URL` | Site origin and localization base URL | `http://localhost:3000` |
| `SITE_IMG` | Optional social image URL | Empty |

These values become public metadata. Local environment files are ignored by Git. Add favicons and social images when the project has its own branding.

## Testing

Vitest has two named projects, adapted from [VueUse's Vitest configuration](https://github.com/vueuse/vueuse/blob/main/vitest.config.ts):

- `unit` uses jsdom and Vue Test Utils. Tests match `*.test.ts` or `*.spec.ts`, excluding browser tests.
- `browser` uses Playwright and `vitest-browser-vue` in headless Chromium and WebKit. Tests match `*.browser.test.ts` or `*.browser.spec.ts`.

Tests can live in `tests/` or alongside application code in `app/`. Both projects support Vue SFCs and the `@`, `~`, `@@`, and `~~` aliases. The test TypeScript project inherits Nuxt's generated types and aliases for editor support. Unit wrappers and browser renders are cleaned up automatically.

```bash
# Unit tests: watch or run once
pnpm test
pnpm test:run

# Install browsers once (also required in CI)
pnpm test:browser:install

# Browser tests: watch or run once
pnpm test:browser
pnpm test:browser:run

# Both projects, once
pnpm test:all
```

To show the browsers while developing, run `pnpm test:browser --browser.headless=false`. On Linux CI, install browser system dependencies with `pnpm exec playwright install --with-deps chromium webkit`.

The starter tests verify the empty homepage, layout slots, and real browser input/focus behavior. This configuration tests standalone Vue code; it does not boot the Nuxt runtime or supply Nuxt auto-imports, plugins, or `#imports`. Use explicit Vue imports in standalone tests and add `@nuxt/test-utils` when a feature needs Nuxt runtime integration tests.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Apply ESLint fixes |
| `pnpm build` | Build for production |
| `pnpm generate` | Generate static output |
| `pnpm preview` | Preview the production build |

Keep the package trust and build policies in `pnpm-workspace.yaml`. Update `pnpm-lock.yaml` with intentional dependency changes and use frozen installs in CI.

## License

MIT. See `LICENSE` for the retained copyright and license text.
