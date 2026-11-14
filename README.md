# TypeFlow

TypeFlow is a responsive typing speed test built with HTML5, CSS3, and vanilla JavaScript. It measures WPM and accuracy in real time, supports three durations and difficulty levels, and persists completed sessions in browser LocalStorage.

## Run locally

Open `index.html` directly in a modern browser, or use VS Code Live Server. No build step, backend, database, or package installation is required.

## Project structure

- `index.html` — dashboard, typing, and results views
- `css/style.css` — responsive dark theme and component styling
- `js/app.js` — navigation and UI orchestration
- `js/test.js` — paragraphs, typing validation, timer, and test state
- `js/stats.js` — WPM, accuracy, date, and display helpers
- `js/storage.js` — validated LocalStorage persistence
