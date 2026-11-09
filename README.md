# temoto

A Chrome extension with Color Picker, Screenshot, CSS inspection, Video Speed, and Proxy switching.

- [Website](https://temoto.shigoto.dev)
- [Install from Chrome Web Store](https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid)
- [Privacy policy](browser/temoto-chrome/PRIVACY.md)

Open temoto from Chrome's toolbar and choose a tool. Proxy affects all regular Chrome windows; saving a new profile does not activate it, and Off clears temoto's override.

The toolbar icon uses a fixed dark outline on a white panel, with transparent corners. Its appearance may vary with custom Chrome themes.

For legacy temoto Proxy users, select Off in the old extension before recreating needed Fixed/PAC URL profiles in temoto. Existing legacy profiles remain available in the [retained source](browser/temoto-proxy/), covered by its [privacy policy](browser/temoto-proxy/PRIVACY.md).

Development and release instructions: [AGENTS.md](AGENTS.md).

## Website on Cloudflare

The website keeps its existing Bun 1.4.4 build. Cloudflare uses Node 24.22.1, `cf` 1.0.0-beta.28 and Wrangler 4.158.0, pinned in `site/package.json` and `site/bun.lock`. The default configuration targets `temoto-site-preview` without a custom domain. Explicit `--mode production` selects `temoto-site` and binds the existing `temoto.shigoto.dev` domain. Retain the last Vercel deployment and its DNS record for rollback.

For automatic publishing, configure Cloudflare Workers Builds for `main` only, with Node 24.22.1, Bun 1.4.4, and root directory `site/`. Use build command `bun run check && bun run test && bun run cf:build:production` and deploy command `node node_modules/cf/bin/cf deploy --prebuilt --mode production --worker temoto-site`. The manual build and publication commands below remain available.

Use the [shared Apple Container setup](/Users/hayashi/work/projects/dev-environment/README.md) with image `dev-environment:0.1.1`. Mount this checkout's `site/` at `/workspace`, use container `temoto-cf-preview-dev`, separate volumes `temoto-cf-preview-home` and `temoto-cf-preview-node-modules`, and map `127.0.0.1:8794` to container port `8794`. The source stays on Mac; dependencies and cache stay in the two volumes. Do not mount Mac credentials.

```sh
container start temoto-cf-preview-dev
container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun install --frozen-lockfile
container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun run check
container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun run test
container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun run cf:check
container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun run cf:dev
```

Open `http://localhost:8794`. Stop the preview with Ctrl+C, then `container stop temoto-cf-preview-dev`. `cf:check` rebuilds the site and Cloudflare Build Output, then validates deployment without uploading. Build Output is generated under `site/.cloudflare/`. On this Mac, cf is globally installed in the existing fnm Node 24.22.1 environment; the default Node remains 24.20.0. After building, publish from an authenticated Mac session in `site/` with `fnm exec --using=24.22.1 cf deploy --prebuilt --worker temoto-site-preview`. This changes only the preview Worker, with no custom domain or production DNS change.

To prepare the production Worker without uploading, run `container exec -w /workspace temoto-cf-preview-dev bunx --package bun@1.4.4 bun run cf:check:production`. Both modes use the same Build Output directory, so rebuild the intended mode immediately before a later deploy. cf beta.28 rejects an explicitly mismatched mode, but omitting the mode trusts Build Output. Both check scripts specify the expected Worker name; a mismatched `--worker` is rejected. After review, the Mac command for production artifacts is `fnm exec --using=24.22.1 cf deploy --prebuilt --mode production --worker temoto-site`. It also applies the production custom domain, so treat it as a live DNS cutover and keep the domain declaration in source for later deployments.

After cutover, verify the public domain and all five demos before retiring the old host. Keep Vercel and its automatic-deployment settings unchanged during the switch. For rollback, pause Cloudflare production publishing, detach the custom domain, then restore the saved Vercel CNAME record. Removing `domains` from this configuration alone does not detach an existing custom domain.

[MIT License](LICENSE)
