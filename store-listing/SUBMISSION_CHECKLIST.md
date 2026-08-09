# Chrome Web Store Submission Checklist

## Account

- [ ] Chrome Web Store developer registration completed.
- [ ] Two-step verification enabled for the publisher Google account.
- [ ] Developer contact email verified.
- [ ] Publisher name confirmed.

## Public URLs

- [ ] Static `/privacy` policy deployed at a permanent public HTTPS URL.
- [ ] Static `/support` page deployed at a permanent public HTTPS URL.
- [ ] Privacy and support URLs open without authentication.

## Dashboard

- [ ] Store listing copied from `STORE_LISTING.md`.
- [ ] Privacy answers copied and verified against `PRIVACY_PRACTICES.md`.
- [ ] Reviewer instructions copied from `REVIEWER_INSTRUCTIONS.md`.
- [ ] Distribution, regions, pricing, and mature-content settings confirmed.
- [ ] Non-affiliation statement retained in the description.

## Package and assets

- [ ] Run `npm run package:extension`.
- [ ] Upload the ZIP created in `release/`.
- [ ] Upload `store-assets/icon-128.png`.
- [ ] Upload the required screenshot from `store-assets/screenshots/`.
- [ ] Upload `store-assets/promo-small-440x280.png`.
- [ ] Verify all images in the dashboard preview.

## Final review

- [ ] Test the unpacked `dist/` build in Chrome.
- [ ] Test enable/disable behavior from the popup.
- [ ] Confirm the package version is higher than any previously uploaded one.
- [ ] Submit with deferred publishing if a final approval checkpoint is wanted.
