#!/bin/bash
# Publishes the app to the repo's gh-pages branch as a GitHub Pages project
# site. Nothing here touches the working tree: the build lands outside the repo
# and the branch is pushed from a throwaway git directory.
set -euo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
OUT=$(mktemp -d -t weddingmall-pages)
SLUG=weddingmall
REMOTE=https://github.com/Alok16012/weddingmall.git

trap 'rm -rf "$OUT"' EXIT
cd "$REPO"

# A project site lives at /<repo>/, so assets must be requested from there too.
# The flag keeps this out of vite.config.ts — the app and the iOS bundle are
# still built at `/`, which is what Capacitor needs.
npx vite build --base="/$SLUG/" --outDir "$OUT" --emptyOutDir

python3 - "$OUT" <<'PY'
import pathlib, sys

out = pathlib.Path(sys.argv[1])
index = out / 'index.html'
html = index.read_text()

inject = '''
    <meta name="robots" content="noindex, nofollow" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="WeddingMall" />
    <script>
      // Capacitor's WebView appends this marker to the user agent; a plain
      // browser does not. Without it isNativeApp() is false and EntryGate skips
      // the welcome screen, so the preview would show the website flow instead
      // of the app flow this link exists to demonstrate.
      (function () {
        var real = navigator.userAgent
        if (real.indexOf('WeddingMallApp') === -1) {
          Object.defineProperty(navigator, 'userAgent', {
            get: function () { return real + ' WeddingMallApp' },
            configurable: true,
          })
        }
      })()
    </script>'''

assert '<head>' in html, 'no <head> to inject into'
html = html.replace('<head>', '<head>' + inject, 1)
index.write_text(html)

# GitHub Pages has no rewrite rules. Serving the same document as the 404 makes
# every client-side route load the app instead of Pages' own error page.
(out / '404.html').write_text(html)

# Keeps this build out of search results so it cannot compete with the real
# weddingmall.online domain.
(out / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')

# Without this, Pages runs Jekyll and drops files whose names start with "_".
(out / '.nojekyll').write_text('')

print('post-processed:', ', '.join(sorted(p.name for p in out.iterdir())))
PY

cd "$OUT"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="Amar" -c user.email="saikapian.amar@gmail.com" \
  commit -q -m "Deploy WeddingMall.Online app preview"
git -c credential.helper='!gh auth git-credential' push -q -f "$REMOTE" gh-pages

echo "deployed → https://alok16012.github.io/$SLUG/  (Pages rebuilds in ~1 min)"
