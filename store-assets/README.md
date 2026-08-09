# Chrome Web Store Assets

Required assets prepared for the listing:

- `icon-128.png` — 128×128 store icon.
- `promo-small-440x280.png` — required small promotional tile.
- `screenshots/01-olwlg-dashboard-1280x800.png` — required real-product
  screenshot captured from the public OLWLG dashboard with the built interface
  applied.

Editable promotional source:

- `promo-small-440x280.svg`

Regenerate the icon and promotional PNG with:

```bash
npm run assets:store
```

The screenshot intentionally uses a real public OLWLG page. Replace or add
screenshots later with authenticated catalog, Matrix, Focused, and Review views
when a suitable participant test account is available. Store screenshots must
continue to show real extension behavior rather than generated UI.

