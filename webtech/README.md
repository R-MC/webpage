# WebTech TV Show Finder

Live URL: https://r-mc.github.io/webpage/webtech/

A standalone HTML, CSS and JavaScript application built with the supplied WebTech logo and colour scheme. This project was created with OpenAI Codex assistance. Review and understand the source and follow your course's authorship and disclosure requirements before submitting it.

## Run and edit
Open this folder in Visual Studio Code. Preview index.html with a local static web server (such as VS Code Live Server). Internet access is required for searches, show details and poster images. No API key, build step or installation is needed by site visitors.

- index.html: semantic page layout and forms.
- styles.css: custom mobile-first CSS; no framework or design template.
- app.js: searches, filters, show details, cast and browser watchlist.
- logo.png: user-supplied WebTech logo.

## How it works
Submit a show title to call TVmaze's search endpoint. The JSON array becomes result cards; its genres populate the genre select. Rating, genre, running status and sorting refine the returned matches locally. Details makes separate calls for the selected show's information and cast. The watchlist stores only IDs and titles in localStorage, with an in-memory fallback if storage is unavailable.

The movie endpoint suggested in the brief did not resolve during testing. The brief allows a different application idea, so this implementation searches television shows through TVmaze instead. It does not claim to be a film database.

## API and source references
- https://www.tvmaze.com/api — search, show information, cast, CORS and licensing.
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog

TVmaze data is attributed in the page and is supplied under CC BY-SA: https://creativecommons.org/licenses/by-sa/4.0/
Poster images remain with their respective rights holders and are loaded from the API's image URLs.

## Assessment criteria mapping
- HTML (20%): header, navigation, main, sections, articles, lists, footer, headings, labelled dialog, details/summary, descriptive page title.
- CSS (20%): external custom CSS; element, class, ID, pseudo-class, attribute and pseudo-element selectors; mobile-first breakpoints; flexible grids and responsive images.
- Forms (15%): labelled search, select menus, numeric input, checkbox, fieldset/legend and buttons. Required values, length checks, range/step validation and whitespace rejection.
- JavaScript (15%): external code, event handling, dynamic results, filtering, sorting, asynchronous requests, modal details and persistent watchlist.
- API (15%): form-driven search, API-derived genre options, show detail and cast endpoints. Uses ONE provider, not multiple providers; this does not satisfy the rubric's specific example of combining different API providers.
- UI/UX/accessibility (15%): supplied branding, keyboard focus, skip link, native validation, status announcements, modal keyboard behaviour, loading/error/empty states and responsive layouts.

## Verification and limits
Browser checks passed in Microsoft Edge: live search and API-derived genres; live show details and cast; keyboard skip link; dialog Escape dismissal; watchlist persistence and removal; required/whitespace input handling; empty results; simulated HTTP 503 with recovery; no page overflow at 320,375,768,1440px; no uncaught JavaScript errors. Screenshots were inspected at mobile and desktop sizes.

These checks are not a full WCAG conformance audit. No screen-reader study, physical-device testing or independent user testing has been completed. API data and availability are controlled by TVmaze. The watchlist is browser-local and not synced between devices. No grade is guaranteed.

## Submission
The brief requests a ZIP containing all project files and a public URL. The prepared ZIP contains this standalone application. Publishing to GitHub Pages is separate from uploading the ZIP and link to Blackboard; no Blackboard submission has been performed.
