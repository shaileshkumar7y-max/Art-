# Nude Art Studio — V2

A responsive, static figure-study archive for GitHub Pages. Built with plain HTML, CSS and JavaScript; no build command, backend, paid API or external image host is needed.

## What changed in V2
- Replaced the abstract placeholder cards with 12 selected artworks retrieved from the available ChatGPT Library image collection.
- Converted the large PNG originals to locally hosted WebP files to reduce page weight. The twelve optimized images total about 3.6 MB.
- Reworked the layout into a dark, museum-inspired editorial gallery with a prominent featured plate, responsive archive grid, metadata and curated collections.
- Added working search, category filters, A–Z sorting, saved artworks (stored only in the visitor's browser), a full-screen viewer, previous/next navigation and keyboard shortcuts.
- Added responsive mobile navigation, accessible labels, skip link, reduced-motion support and an adult entry reminder.

## Artwork files
All gallery images are stored locally in `assets/`. They are digital figure-study / anatomy-style plates selected from the available Library assets. The title and description shown on the site are editorial labels, not assertions of historical provenance or the identity of an artist/model.

Before publishing publicly, confirm that the uploaded artwork may be redistributed, that all depicted subjects are adults, and that any required model/creator permissions are in place. Do not add pornographic imagery, graphic depictions of sexual acts, non-consensual intimate imagery or any content involving minors. The entry prompt is only an age reminder and does not verify age or identity.

## Publish with GitHub Pages
1. Create a public repository named `Nude-Art-Studio` in the intended GitHub account.
2. Upload the contents of this folder to the repository root (not the containing folder itself).
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, then select `main` and `/(root)` and save.
5. The expected URL is `https://YOUR-USERNAME.github.io/Nude-Art-Studio/`.

## Local preview
Open `index.html` in a modern browser. For the most accurate preview, serve this folder using any simple static file server; there is no build step.
