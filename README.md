# Lingder

Learn Japanese kana and Taiwan Zhuyin with a swipeable flashcard deck, pronunciation audio, and small daily practice sessions.

Built with Nuxt 4, Vue 3, TypeScript, Nuxt UI, Tailwind CSS, and Pinia.

## Features

- **Japanese kana:** 46 basic hiragana and 46 basic katakana, tracked separately. Study either script or both, with optional historical ゐ / ゑ / ヰ / ヱ.
- **Taiwan Zhuyin:** 37 symbols with pinyin sound guides.
- **Daily practice:** Choose a goal of 5, 10, or 20 cards per language, then continue with extra practice.
- **Flexible readings:** Keep pronunciation guides visible or reveal them on demand.
- **Pronunciation audio:** Listen from a card or explore the pronunciation table at `/table`. In reveal mode, audio becomes available after revealing the reading.
- **Undo and mastery:** Undo multiple ratings in the current deck and return mastered characters to practice.
- **Accessible controls:** Swipe, use labeled buttons, or study with the keyboard. Responsive layouts support phones, tablets, and desktops, with light/dark themes and reduced motion.

The interface supports Traditional Chinese (default), English, and Japanese. Unprefixed URLs open in Traditional Chinese. Use the header language switch to choose English or Japanese; localized URLs preserve that choice when navigating or refreshing. The interface language and the language you study are independent.

Swipe left/right for **Review later** and up/down for **Mastered**. When the card is focused, arrow keys do the same; Space or Enter reveals a hidden reading.

## Local setup

Use pnpm and the Node/pnpm versions declared in [package.json](package.json).

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Configuration

Configure public metadata in `.env`, using [.env.example](.env.example) as a starting point:

| Variable | Purpose | Default |
| --- | --- | --- |
| `SITE_NAME` | Document and social title | `Lingder` |
| `SITE_DESC` | Optional description | Empty |
| `SITE_URL` | Site origin and localization base URL | `http://localhost:3000` |
| `SITE_IMG` | Optional social image URL | Empty |

These values become public metadata; never put secrets in them. Local environment files are ignored. Keep `SITE_URL` set to localhost for development; the deployment workflow sets it to `https://lingder.olimak.dev` for production generation.

## Development and testing

Install the browser test engines, then run lint and the full test suite:

```bash
pnpm test:browser:install
pnpm lint
pnpm test:all
```

Vitest covers datasets, study sessions, persistence, Undo, extra practice, and interactions. Browser tests run in Chromium and WebKit. These tests use standalone Vue components rather than the full Nuxt runtime, so browser checks of the running app remain useful. A dedicated full Vue typecheck command is not configured.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint:fix` | Apply ESLint fixes |
| `pnpm test` | Watch unit tests |
| `pnpm test:browser` | Watch browser tests |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:browser:run` | Run browser tests once |
| `pnpm build` | Build for production |
| `pnpm generate` | Generate the static site in `.output/public` |
| `pnpm preview` | Preview the production build |

See [AGENTS.md](AGENTS.md) for development conventions and the repository map.

## Deployment

Lingder is configured for static hosting on **Cloudflare Workers Static Assets**. Publishing a stable GitHub release builds, tests, and deploys that release's exact commit. Normal pushes, draft releases, and prereleases do not deploy.

The first release creates the Worker; its custom domain must then be attached before production verification can pass. See the [deployment guide](docs/deployment.md) for credentials, free-plan checks, local validation, first launch, and recovery.

## Browser storage and limitations

Settings, mastery, and daily sessions are saved in your browser's localStorage under `lingder.study.v1`. Clearing site data removes progress. There are no accounts or cross-device synchronization. If storage is unavailable, study can continue in memory with a warning.

Daily goals follow your device's local calendar. Undo history lasts for the current deck during your visit; starting a new deck, including extra practice, clears it.

“Review later” makes a card eligible for future random practice; it does not schedule a spaced-repetition review. Vocabulary decks, voiced kana forms, and kana combinations are not included yet. Zhuyin pinyin guides describe sounds and are not always standalone syllables.

## Credits and licenses

### Dataset references

- [Japan Foundation kana charts](https://classroomresources.sydney.jpf.go.jp/resources/hiragana-katakana-game/)
- [Taiwan Ministry of Education phonetic-symbol manual](https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html)
- [Unicode hiragana](https://www.unicode.org/charts/PDF/U3040.pdf) and [katakana](https://www.unicode.org/charts/PDF/U30A0.pdf) code charts

### Licenses

Application code is licensed under MIT. See [LICENSE](LICENSE) for copyright and attribution.

Pronunciation recordings have separate licenses:

- Modern Japanese kana: FUN Japanese Learning, obtained through kana-trainer, under CC BY 4.0.
- Historical Japanese kana: public-domain recordings from Wikimedia Commons.
- Taiwan Zhuyin: Taiwan Ministry of Education recordings under CC BY 4.0.

See the [recording manifest](app/data/audio/manifest.json) and [audio license notices](public/audio/licenses/) for source URLs, attribution, and processing details. These credits are also available from the app footer.
