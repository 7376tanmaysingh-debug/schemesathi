# SchemeSaathi

A mobile-friendly guide to Indian public-benefit schemes and scholarships. Visitors must sign in with Firebase Authentication before SchemeSaathi opens.

## Run locally

Serve the folder through a local web server; ES modules and Firebase Auth do not work when opened as a file URL. For example, use Python's built-in server on port 8000, then open http://localhost:8000.

## Configure authentication

1. Create a Firebase project and register a Web app in Firebase Console.
2. Copy the Web app configuration into firebase-config.js. This client configuration is public and is not a private server credential.
3. In Authentication > Sign-in method, enable Email/Password, Google, and Phone.
4. In Authentication > Settings, add your local development host and deployed site host to Authorized domains. Phone authentication does not work on localhost; test OTP on an authorized deployed domain or connect the Firebase Auth Emulator.
5. Review the Phone authentication region policy and SMS limits. Use Firebase test phone numbers during development.
6. Deploy over HTTPS, then try email verification, Google sign-in, and phone OTP.

Until Firebase configuration is filled in, the sign-in screen remains visible and the site stays closed. Email/password accounts must verify their email before the site opens. Phone sign-in uses Firebase's reCAPTCHA verification.

## Website features

- Guided topic finder for health, farming, housing and energy, women and family, business, education, and scholarships
- Searchable scheme directory with topic filters and sorting
- Plain-language scheme summaries and links to official sources
- Saved schemes stored locally and separated by signed-in account
- Google sign-in, email/password with email verification, password reset, and phone OTP
- Responsive navigation, mobile layouts, keyboard search shortcut, FAQs, and privacy information

## Security and privacy

Firebase Authentication verifies the account before the page reveals the SchemeSaathi interface. The sign-in screen is a client-side access gate. GitHub Pages and other static hosting serve site files publicly, so a visitor can still download the JavaScript and scheme catalogue directly. Do not put confidential data or private documents in this repository. Protect private records behind a server that verifies Firebase ID tokens, or use Firebase services with correctly configured Security Rules.

The Firebase Web app configuration in firebase-config.js is public by design. Never put service-account keys or other server credentials in client-side files. Phone numbers supplied for authentication are sent to and stored by Google to send verification SMS and help prevent spam and abuse; carrier charges may apply. SchemeSaathi does not request Aadhaar numbers, income details, or government account credentials.

SchemeSaathi is an independent guide, not a government service. The finder filters by selected topics and does not determine eligibility. The directory is curated and incomplete. Programme terms, benefits, documents, and application windows may change; confirm all details with the linked official source.

## Project files

- index.html — sign-in screen and protected site structure
- firebase-config.js — public Firebase Web app configuration placeholder
- app.js — authentication, search, filters, topic finder, saved schemes, and details
- scheme-data.js — curated summaries and official links, loaded after sign-in
- styles.css — visual design and responsive layouts
