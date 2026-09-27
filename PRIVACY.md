# Privacy

WebLite is designed to work locally in the browser.

## What WebLite reads

Depending on the selected mode, WebLite may inspect browser-visible page information such as:

- resource timing entries
- request counts
- page-visible media and image elements
- cookie counts and cookie change events
- the current tab URL / hostname
- extension settings saved in browser storage

## What WebLite does not do

WebLite does not:

- create a user account
- send browsing history to a WebLite server
- upload cookie values
- sell or share browsing data
- run remote analytics
- inject advertising

There is currently no WebLite backend server.

## Cookie telemetry

The popup can show cookie counts and cookie activity so the user can see that the page is changing state while they browse.

That telemetry is for **counting / activity**, not for displaying the contents of cookies.

## Local settings

Mode choices and extension preferences are stored with the browser extension storage APIs so WebLite can remember how the user wants it to behave.

## Measurement limitations

Browser performance APIs do not reveal every network byte in every situation. Cached and cross-origin resources may be reported differently, so WebLite treats its transfer numbers as **browser-observed measurements**, not billing-grade network totals.

## Contact

If you are reviewing this project for the hackathon and notice a privacy issue, please open a GitHub issue in this repository.
