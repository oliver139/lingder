# Deployment

[Back to the README](../README.md)

Run the commands in this guide from the repository root.

Lingder uses Nuxt static generation (SSG) on Cloudflare Workers Static Assets. The production address is **https://lingder.olimak.dev**; it is not live until the first stable release and one-time domain setup are complete. Pages, translations, fonts, and pronunciation audio are generated or copied at build time. Study progress remains in the browser. No application server, database, or paid Cloudflare resources are required.

## Release workflow

Publishing a **stable GitHub release** runs the [deployment workflow](../.github/workflows/deploy.yml):

1. Check out the release's exact commit and install the declared Node/pnpm versions with the frozen lockfile.
2. Run lint, unit tests, and Chromium/WebKit browser tests.
3. Generate all eight card/table routes, with `SITE_URL=https://lingder.olimak.dev`.
4. Package `.output/public` into Cloudflare Build Output, validate it without uploading, and deploy it with the pinned `cf` CLI.
5. Verify localized pages, audio, 404 responses, and the deployed commit identifier. Report the result in the Actions summary.

Pushes, draft releases, and prereleases do not deploy. Release edits do not redeploy. The workflow serializes production runs; a failing check or build prevents deployment. Keep Cloudflare's separate Git-triggered builds disabled. Application and workflow changes must be included in the release tag before publication.

## Credentials and free-plan checks

Configure these repository Actions secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Dedicated account-scoped token with Workers Scripts Write and Account Settings Read permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account owning the Worker and `olimak.dev` |

Only the deployment step receives these secrets. Domain setup uses the owner's local Cloudflare login, not the release token. Never store tokens in tracked files or workflow logs.

Use the Cloudflare Free plan and standard Ubuntu GitHub runners. Before publishing the first release, review GitHub **Settings → Billing and licensing → Budgets and alerts** and the account's included Actions usage. Keep paid Actions usage blocked; this private repository shares the account's included compute allowance. Do not enable paid overages to work around quota limits. No billing settings are changed by the workflow.

## Local validation

```bash
pnpm install --frozen-lockfile
pnpm test:browser:install
pnpm lint
pnpm test:all
SITE_URL=https://lingder.olimak.dev pnpm generate
DEPLOY_REVISION=$(git rev-parse HEAD) pnpm deploy:package
pnpm deploy:check
```

`deploy:package` uses Cloudflare's build-output utilities to create an assets-only package; `deploy:check` does not upload or publish it. Both deployment dependencies are pinned because `cf` is currently beta. Do not run bare `cf build` or `cf deploy`: framework autodetection can build a server-rendered Nuxt app instead of this SSG package. Use `--prebuilt --mode production` for deployment. The unused transitive `workerd` install script is explicitly denied in pnpm's build policy; this pipeline does not run a Worker locally.

## First release and custom domain

Cloudflare requires the Worker to exist before binding its custom domain. To avoid publishing the app before a release:

1. Commit and push the reviewed setup, then publish a stable release from that commit. The first deployment creates the `lingder` Worker. Its production smoke check cannot pass until the domain is attached.
2. Using the same release checkout, generate and package it as above. Sign in locally with `pnpm exec cf auth login`. Confirm that `lingder.olimak.dev` has no unrelated DNS record.
3. Prepare and apply the domain binding with the owner's local credentials:

```bash
DEPLOY_REVISION=$(git rev-parse HEAD) pnpm deploy:package --bind-domain
pnpm exec cf workers triggers deploy --prebuilt --mode production --dry-run
pnpm exec cf workers triggers deploy --prebuilt --mode production
DEPLOY_REVISION=$(git rev-parse HEAD) pnpm deploy:package
DEPLOY_REVISION=$(git rev-parse HEAD) pnpm deploy:smoke
```

The trigger command attaches `lingder.olimak.dev` and lets Cloudflare provision HTTPS; it does not upload a new app version. The final packaging command removes domain-management settings from the local release package. Subsequent CI deployments leave domain management to the owner. Once DNS and HTTPS are ready, rerun the first release's failed workflow if needed. All subsequent stable releases deploy automatically.

## Recovery

- If installation, tests, generation, or validation fails, production remains on the previous deployment. Fix the problem and publish a new release, or rerun the existing workflow for a transient infrastructure failure.
- If upload succeeds but the smoke check fails, the new deployment may already be serving traffic. Inspect the Actions log and Cloudflare's deployment history; the workflow does not silently roll back.
- Restore a known-good version from Cloudflare **Workers & Pages → lingder → Deployments**, or use the locally authenticated CLI:

```bash
pnpm exec cf workers deployments create --worker lingder --strategy percentage --versions '[{"version_id":"KNOWN_GOOD_VERSION_ID","percentage":100}]'
```

Then run `DEPLOY_REVISION=KNOWN_GOOD_COMMIT pnpm deploy:smoke`. Do not repoint release tags. Re-running an older release workflow intentionally redeploys that older commit.

Reference: [Cloudflare CLI CI setup](https://developers.cloudflare.com/cf/ci/), [GitHub release events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release), and [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

