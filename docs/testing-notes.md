# Testing notes

These are the checks I use before calling a build "working."

## Primary test site

**https://play.arc.gg/** is one of the main websites used while testing WebLite. It remains the main stress-test page for the project, while Study mode should also be tried on a normal learning/article page.

If you are testing or reviewing the project, this is a good place to start. It is useful for seeing the difference between Normal, Balanced and Saver modes and for watching live request / transfer / resource activity.

Suggested test:

1. load the site normally
2. capture the baseline
3. enable Balanced
4. compare the live values
5. try Saver
6. test any available Load once controls
7. restore normal mode

WebLite was also checked on other kinds of sites because one website cannot represent every page on the web.

## Basic install

- extension loads without manifest errors
- popup opens
- current site name appears
- modes can be changed
- settings page opens
- tutorial page opens
- restore normal works

## Balanced mode

- normal text stays readable
- important images are not blindly removed
- obvious autoplay media is reduced
- page is still usable

## Study mode

- readable text stays intact
- same-site diagrams/images remain available
- cross-site images are reduced
- autoplay video/audio stays stopped
- web fonts and third-party embeds are reduced
- motion is reduced without using the full Freeze behavior
- **Load once** restores an individual image, video or embed when it is actually needed for schoolwork

A useful student test is to open a study article or learning page, enable Study mode, and confirm that the lesson remains understandable even with optional resources reduced.

## Saver mode

- stronger media blocking works
- third-party embeds are reduced
- custom fonts are blocked where possible
- motion is noticeably reduced

## Ultra mode

- images / media are aggressively reduced
- blocked-content placeholders appear
- Load once can restore an individual item
- the page can still be returned to normal

## AI Smart Filter

- Study mode automatically runs the conservative local Smart Filter
- obvious/high-confidence ad or promo containers can be hidden
- useful main/article content should remain
- login, payment, captcha, consent and form surfaces should remain
- open **AI Smart Filter / Page Coach**
- check the “Hidden by WebLite” list
- restore one item
- use **Undo last hide**
- use **Restore everything**
- try chat commands such as “what did you hide?” and “restore item 1”
- if browser AI is unavailable, the page should still work in Local precision mode

A wrong hide is considered more serious than leaving an uncertain ad visible, so the classifier is intentionally conservative.

## Live telemetry

Check that values update instead of staying as dashes:

- transferred / observed data
- request count
- request reduction
- cross-site resources
- cookie count / activity
- image / script / stylesheet / font / media / frame counts

A value of **0** is okay. A permanent placeholder is not.

## Other stress tests

### Apple.com

Useful because it has:

- custom typography
- scroll animation
- product imagery
- video / visual effects
- layout that can break if fonts are replaced badly

This site exposed the font-metric problem in an earlier build.

### Video-heavy pages

Used to check whether:

- autoplay stays stopped
- dynamically created media stays stopped
- Load once still works when the user explicitly wants the video

### Normal article / documentation pages

Used to make sure Balanced mode is actually pleasant to browse and not just technically "lighter."

## Protected pages

Internal browser pages and extension stores are expected to be unavailable to normal content scripts. That is treated as a browser restriction, not as a WebLite bug.
