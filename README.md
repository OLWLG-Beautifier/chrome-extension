# OLWLG Beautifier

A Manifest V3 Chrome extension that gives
[OLWLG](https://bgg.activityclub.org/olwlg/) a clearer, more accessible
interface.

The popup is statically exported from Next.js. During packaging, its static
HTML and CSS are extracted without Next.js's reserved `_next` directory or
unneeded hydration runtime. A small, separately bundled content script applies
the site styles and keeps the enabled preference in Chrome sync storage.

## Run locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
# Add your BGG_API_TOKEN value to .env.local.
npm run build
```

The BGG application token is injected only into the generated background
service worker. `.env.local`, `dist/`, and release archives are excluded from
Git. Because the finished extension runs on users' devices, its bundled token
must still be treated as extractable and should be monitored and rotated if
misused.

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Choose this project's `dist` directory.
5. Open or refresh an OLWLG page.

Use the toolbar popup to switch the new interface on or off.

The replacement interface icons are selected from the
[Lucide](https://icon-sets.iconify.design/lucide/) Iconify pack and bundled
locally with the extension.

On the full math-trade catalog (`viewlist.cgi?...&viewall=1`), the extension
adds live item search, participant, item-type, BGG-rank, and collection-status
filters, card sorting, result counts, guide-aware
tooltips, progressively loaded BoardGameGeek cover images, money-range
filtering for alternative items, highlighted status
messages, and loading feedback. It adapts each server-rendered table row into a
full-width item card while retaining the source table in the DOM so OLWLG's
existing actions continue to work. Cards separate the linked title, utility
actions, game metadata, version, user description, and Add-to-wants controls.
Descriptions open in an accessible modal and omit legacy comment attachments.
The original `clickwant(...)` control is retained for every applicable item,
with its real `.cw` selection panel presented in the same modal.

The catalog preamble is reorganized into a single information card with the
trade title, overview, scrollable important notices, and page actions.

On Math Trade Gateway Steps 4 and 5, the extension presents a compact
relationship matrix by default while retaining a focused per-offer editor.
Both views operate on OLWLG's original form controls.
Search, filters, offer coverage, contextual bulk selection with undo, unsaved
change warnings, and keyboard navigation stay synchronized across views.
Step 5 becomes a read-only validation and review summary with submission kept
separate from Step 4's save action. Narrow screens use the focused editor and
horizontal offer picker instead of the matrix.

The legacy navigation strip is upgraded into a categorized dropdown navbar
while retaining OLWLG's original icons, links, account information, and
donation controls. The signed-in user area remains anchored on the right and
uses its own accessible profile menu. The catalog content is covered by a
loading screen until the card interface is ready.

## Development

```bash
npm run dev
```

This previews the popup at `http://localhost:3000`. Run `npm run build` and
reload the unpacked extension after changing extension files.

## Project structure

- `pages/` and `styles/`: Next.js popup
- `extension/manifest.json`: Manifest V3 configuration
- `extension/background/`: authenticated, rate-limited BGG image requests and cache
- `extension/content/`: code and CSS injected into OLWLG
- `scripts/`: production build assembly
- `dist/`: load this generated directory in Chrome

## Chrome Web Store release

Generate the required listing artwork and an upload-ready ZIP:

```bash
npm run screenshot:store
npm run package:extension
```

The package is written to `release/`. Store descriptions, privacy answers,
reviewer instructions, and the remaining publisher-account steps are in
`store-listing/`. Required image assets are in `store-assets/`.

The build also exports public privacy and support pages to
`out/privacy/index.html` and `out/support/index.html`. Deploy `out/` to a
permanent HTTPS host, then enter the
deployed `/privacy` and `/support` URLs in the Chrome Web Store dashboard. A
public URL cannot be created by the source build itself; it requires a hosting
account or existing public repository.
