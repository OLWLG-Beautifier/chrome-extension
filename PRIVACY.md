# OLWLG Beautifier Privacy Policy

Effective date: August 9, 2026

OLWLG Beautifier is a browser extension that reorganizes and restyles the
OLWLG math-trade interface. The extension is independent and is not affiliated
with or endorsed by OLWLG or BoardGameGeek.

## Summary

OLWLG Beautifier does not send personal information, OLWLG page content, or
usage analytics to the developer. It does not sell user data and does not use
data for advertising, profiling, credit decisions, or any purpose unrelated to
improving the OLWLG interface.

## Information processed

To provide its user-facing features, the extension processes the following
information locally in the browser:

- Content already displayed on OLWLG pages, such as math-trade titles, game
  information, participant usernames, collection indicators, notices, and
  want-list form state.
- The signed-in OLWLG or BoardGameGeek username when it appears on an OLWLG
  page. This is used only to determine whether editing controls should be
  available for the current math trade.
- Interface state such as whether the extension is enabled, selected display
  mode, remembered trade status, calculated deadline timestamps, and cached
  BoardGameGeek cover-image URLs.

The extension does not read passwords or payment information.

## How information is used

Information is used only to:

- Restyle and reorganize the OLWLG interface.
- Provide search, filtering, matrix navigation, review, deadline, and
  read-only-state features.
- Retrieve cover images from the registered BoardGameGeek XML API when an
  OLWLG item catalog is opened.
- Keep the extension's enabled preference and limited interface state between
  page visits.
- Request additional OLWLG or BoardGameGeek pages over HTTPS when necessary to
  display a user-requested OLWLG or marketplace feature.

## Storage and transmission

- Chrome Sync stores only the extension's enabled or disabled preference.
- Chrome Local Storage caches public BGG item-image URLs and the last API
  request time to reduce requests and respect BGG's rate limits.
- Browser local storage and session storage may retain interface state, math
  trade identifiers, deadline timestamps, and a local participation result.
- OLWLG page content and form state are processed in the browser and are not
  transmitted to the developer.
- When an item catalog is opened, the extension sends the public numeric BGG
  item identifiers already present in OLWLG's links directly to the
  BoardGameGeek XML API over HTTPS. It does not include participant usernames,
  want-list state, or other OLWLG page content in those API requests.
- Other requests made to OLWLG or BoardGameGeek may use the user's existing
  signed-in session. Their handling of those requests is governed by their own
  policies.

## Sharing and sale

The developer does not receive, sell, rent, or share user data. The extension
contains no advertising, analytics, tracking pixels, or developer-operated
data-collection service.

## Retention and user control

Users can disable the extension from its toolbar popup or remove it through
Chrome. Removing the extension also removes its cached BGG image URLs. Chrome
Sync data is controlled through the user's Chrome account. Locally stored
OLWLG state can be removed through the browser's site-data controls for
`bgg.activityclub.org`.

## Changes

If the extension's data practices change, this policy and the Chrome Web Store
privacy disclosures will be updated before the changed behavior is released.

## Contact

Questions about this policy can be sent to
[olwlg.beautifier@gmail.com](mailto:olwlg.beautifier@gmail.com).
