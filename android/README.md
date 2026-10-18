# NotGPT Android App

🚧 **Native wrapper: coming soon. Installable app: available now.**

NotGPT is already an installable, offline-capable web app. On Android, open the site in Chrome → menu → **Install app** (or **Add to Home screen**). On iPhone, Safari → Share → **Add to Home Screen**.

The Android app will be a lightweight WebView wrapper that loads the NotGPT web app.

## How It Will Work

- The `web/` folder contains all the logic
- Android app simply wraps it in a WebView
- **Online mode**: Loads from the hosted URL (always up-to-date)
- **Offline mode**: Bundles the `web/` folder locally

## No Code Duplication

All tools, UI, and logic live in `web/`. The Android folder only contains:
- WebView wrapper (one file)
- App icons and splash screen
- AndroidManifest.xml

## Play Store later

The simplest route to the Play Store is a Trusted Web Activity (for example with Bubblewrap), which packages this same PWA with no duplicated code.
