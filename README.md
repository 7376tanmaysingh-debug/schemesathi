# SchemeSaathi

A mobile-friendly, static website that helps people explore a curated set of Indian public-benefit schemes, build a topic-based shortlist, and continue to official sources.

## Run locally

No framework, build step, or dependency installation is required. Open \`index.html\` in a browser, or serve this folder with a static server such as:

\`\`\`sh
python -m http.server 8000
\`\`\`

Then visit \`http://localhost:8000\`.

## Website features

- Home page with clear paths into discovery
- Topic finder for health, farming, housing and energy, women and family, business, and education
- Scholarship listings for school and college students, with links to the live National Scholarship Portal
- Searchable scheme directory with topic filters and sorting
- Scheme detail dialogs with plain-language summaries and official links
- Saved schemes stored locally in the current browser
- Responsive navigation, mobile layouts, keyboard search shortcut, FAQ, and privacy information
- No account, API, or personal information required

## Important

SchemeSaathi is an independent guide and is not a government service. The finder filters by selected topics; it does not determine eligibility. The directory is curated and incomplete. Programme terms, benefits, documents, and application windows may change, and some programmes vary by state. Confirm all details with the linked official source before applying.

Saved scheme IDs are stored in browser local storage. Finder choices are used only to filter the current page and are not sent to a server.

## Project files

- \`index.html\` — site structure and content
- \`styles.css\` — visual design and responsive layouts
- \`scheme-data.js\` — curated scheme summaries and official links
- \`app.js\` — search, filters, topic finder, saved schemes, and details
