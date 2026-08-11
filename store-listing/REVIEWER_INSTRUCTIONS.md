# Chrome Web Store Reviewer Instructions

## Overview

OLWLG Beautifier is a content-script extension for the OLWLG math-trade tools.
It runs only on `https://bgg.activityclub.org/olwlg/*` and replaces the legacy
presentation with a clearer interface while retaining the site's original
links, forms, and actions.

## Basic public test

1. Install the submitted extension package.
2. Open `https://bgg.activityclub.org/olwlg/`.
3. Confirm that the public OLWLG dashboard receives the modern navigation,
   cards, notices treatment, and organized help/settings panels.
4. Open the extension toolbar popup.
5. Turn **Modern interface** off and confirm that the OLWLG page reloads with
   its original presentation.
6. Turn it on again and confirm that the enhanced presentation returns.

## Trade catalog test

1. From the OLWLG dashboard, open an available active or previous math trade.
2. Open its item catalog.
3. Confirm that the extension provides catalog cards, filters, sorting,
   information panels, progressively loaded BGG cover images, and locally
   generated deadline/status presentation.

## Authenticated features

OLWLG authentication is provided by the OLWLG/BoardGameGeek service and is not
implemented by this extension. Want-list editing and participant-specific
controls are visible only to an OLWLG participant signed into the service. The
extension does not receive or store login credentials. If the Chrome Web Store
requires credentials to review these participant-only flows, the publisher
must provide a temporary reviewer account securely in the dashboard rather
than adding credentials to this repository or package.

## Permissions

- `storage`: saves the enabled preference.
- `https://bgg.activityclub.org/olwlg/*`: injects and operates the enhanced UI
  only on OLWLG pages.
- `https://boardgamegeek.com/*`: lets the background service worker request
  cover-image URLs from the registered BGG XML API. The extension does not
  inject code into BoardGameGeek pages.

## Network behavior

The extension contains no analytics and communicates with no
developer-operated server. When an OLWLG catalog opens, it sends only the
public numeric BGG item IDs present in that catalog to the BoardGameGeek XML
API and locally caches the returned image URLs. It may also request additional
OLWLG or BoardGameGeek HTML over HTTPS to display a user-facing catalog or
marketplace view.

## Contact

olwlg.beautifier@gmail.com
