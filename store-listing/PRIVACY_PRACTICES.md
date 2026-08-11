# Chrome Web Store Privacy Practices

Use this text when completing the Privacy tab. Confirm that the dashboard's
wording still matches these answers before submitting.

## Single purpose

OLWLG Beautifier improves the readability and usability of OLWLG math-trade
pages by reorganizing their existing interface and adding local search,
filtering, navigation, deadline, want-list editing, and review controls.

## Permission justifications

### `storage`

Stores only the user's enabled or disabled preference in Chrome Sync. The
extension also uses Chrome Local Storage to cache public BGG item-image URLs
and the last API request time. Ordinary browser local and session storage on
OLWLG pages retains limited interface state, calculated deadline timestamps,
remembered trade status, and a local participation result.

### Host access: `https://bgg.activityclub.org/olwlg/*`

Required to inject the enhanced interface into OLWLG pages and read the
existing page structure needed for the user-facing catalog, filtering,
want-list, deadline, and review features. The extension does not run on
unrelated websites.

### Host access: `https://boardgamegeek.com/*`

Required by the extension service worker to request cover-image URLs from the
registered BoardGameGeek XML API for the numeric BGG item IDs found in an open
OLWLG catalog. No content script is injected into BoardGameGeek pages.

### Web-accessible resource

Exposes only the bundled OLWLG Beautifier SVG icon to OLWLG pages so that a
local fallback image can be displayed. No executable code is exposed.

## Remote code

No. All JavaScript, CSS, and icon definitions used by the extension are bundled
inside the uploaded package. The extension does not download or execute remote
code.

## Data handled

Disclose the following categories because Google treats local processing as
data handling:

- Website content: math-trade titles, game information, participant names,
  collection indicators, notices, and want-list form state displayed by OLWLG.
- Personally identifiable information: the OLWLG or BoardGameGeek username
  displayed on the page, used locally to determine whether editing is
  available.

The extension does not read passwords, authentication cookies, payment
information, health information, precise location, personal communications, or
browsing history outside OLWLG.

## Data use and sharing

- Used only to provide the extension's disclosed single purpose.
- Processed locally in the browser.
- Not transmitted to the developer.
- Not sold or shared with third parties.
- Not used for advertising, profiling, creditworthiness, or lending.
- Not used for any purpose unrelated to the extension's single purpose.
- Public numeric BGG item IDs are sent directly to the BoardGameGeek XML API
  over HTTPS only when an OLWLG item catalog is opened, and returned image URLs
  are cached locally to reduce requests.
- Other requests to OLWLG or BoardGameGeek are made directly over HTTPS only
  when needed for a user-facing feature and may use the user's existing site
  session.

## Limited Use certification

The use of information received from Chrome APIs complies with the Chrome Web
Store User Data Policy, including the Limited Use requirements.

## Privacy policy

Enter a permanent, publicly accessible HTTPS URL for the policy. The repository
provides both `PRIVACY.md` and a statically exported `/privacy` page, but the
publisher must deploy one of them before submission.
