# Crownly brand assets

| File | Use |
|------|-----|
| `crownly-logo.png` | Transparent PNG — in-app UI (`CrownlyLogo`), splash, Android adaptive foreground, web favicon |
| `icon-with-background.png` | Source for App Store only (do not use in UI) |
| `icon.png` | iOS/Android store listing icon (1024×1024, dark background baked in) |

Regenerate `icon.png` from `icon-with-background.png` after updating the App Store artwork:

```bash
sips -z 1024 1024 icon-with-background.png --out icon.png
```

Bundle ID: `com.crownly.app` (see `app.json`).
