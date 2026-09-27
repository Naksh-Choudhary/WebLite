# WebLite Privacy

WebLite is local-first.

- No account is required.
- No analytics or tracking SDK is included.
- No data is sent to a WebLite server.
- No external AI/API service is used.
- Settings, remembered site modes and aggregate impact totals are stored locally in Chrome.

## Cookie telemetry

WebLite uses the browser's Cookies API only to count cookies applicable to the current page and to count cookie change events. It also reports how many of those cookies are HttpOnly.

**WebLite never displays, exports, logs, or saves cookie names or cookie values.**

## Page telemetry

Live resource measurements come from browser Resource Timing data exposed to the page. Browser security rules may hide exact byte sizes for some cross-origin or cached resources; WebLite labels the result as browser-observed/measured data rather than claiming exact ISP usage.
