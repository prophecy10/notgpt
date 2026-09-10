# NotGPT Android App

🚧 **Coming Soon**

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

## Alternative: PWA

Before the native app, NotGPT can be installed as a Progressive Web App (PWA) directly from Chrome on Android. Just visit the website → "Add to Home Screen".
