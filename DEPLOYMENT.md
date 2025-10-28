# Deployment to GitHub Pages

This project is designed to run directly on GitHub Pages without any build process.

## Quick Start

Simply enable GitHub Pages in your repository settings:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select the branch you want to deploy (e.g., `main` or `copilot/run-code-in-github-pages`)
4. Click **Save**
5. Your site will be available at: `https://[username].github.io/[repository-name]/`

## No Build Required

This project uses:
- **Pure HTML/CSS/JavaScript** - no transpilation needed
- **CDN resources** - MapLibre GL JS is loaded from unpkg.com
- **Embedded data** - GeoJSON data is included directly in the JavaScript

## Local Development

To test locally:

```bash
# Start a simple HTTP server
python3 -m http.server 8000

# Or use any other static file server
# Then open http://localhost:8000 in your browser
```

## Features

- Interactive map visualization of the Tokaido road
- Timeline of events from the Kodoku competition
- Clickable markers for stations and events
- Responsive design for mobile and desktop
- Modal dialogs for detailed event information

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript (2015+)
- CSS Grid and Flexbox
- MapLibre GL JS

## Credits

- Maps powered by [MapLibre GL JS](https://maplibre.org/)
- Basemap from [OpenStreetMap](https://www.openstreetmap.org/)
