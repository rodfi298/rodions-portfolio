# Rodions Timošins Portfolio

Minimalist static portfolio with a browser admin panel.

## What Is Included

- Public portfolio: `index.html`
- Admin panel: `admin.html`
- Editable content: `content/site.json`
- No build step, no npm, no paid backend.

## How Editing Works

1. Open `/admin.html`.
2. Unlock the private admin screen with a GitHub token for this repository.
3. Edit profile, works, experience or settings.
4. Press **Save changes**.
5. The admin panel commits `content/site.json` to GitHub.
6. Vercel redeploys the site automatically.

The admin panel needs a GitHub fine-grained token with access only to this repository and **Contents: Read and write**. The token is used in your browser only. If you do not check **Remember token**, it is not stored.

## Media Workflow

Keep heavy media on Cloudinary, Vimeo or YouTube. In the admin panel you can:

- paste a direct Cloudinary/Vimeo/YouTube URL;
- or use **Upload** after adding Cloudinary cloud name and unsigned upload preset in Settings.

Cloudinary uploads are saved as optimized delivery URLs with automatic format and quality where possible. Direct videos open with browser controls and sound.

## Vercel Setup

When importing the GitHub repository into Vercel:

- Framework preset: **Other**
- Build command: empty
- Output directory: empty

See `docs/MEDIA_WORKFLOW.md` for the simple non-code workflow.
