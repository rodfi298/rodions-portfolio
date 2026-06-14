# Simple Media Workflow

## Best Free Setup

- GitHub stores the website and `content/site.json`.
- Vercel hosts the site.
- Cloudinary stores photos and videos.

This keeps the site fast and avoids putting large videos into GitHub.

## Add A Work Without Code

1. Open `/admin.html`.
2. Go to **Works**.
3. Press **Add work**.
4. Fill title, year, category and descriptions.
5. Add media:
   - paste a Cloudinary/Vimeo/YouTube URL;
   - or press **Upload** if Cloudinary is configured in **Settings**.
6. Press **Save changes**.

## Cloudinary Setup

In Cloudinary:

1. Open **Settings**.
2. Create an **unsigned upload preset**.
3. Copy your **cloud name** and the preset name.
4. Paste both into `/admin.html` → **Settings**.
5. Save changes.

## GitHub Save Setup

Create a fine-grained GitHub token with:

- Repository access: only this portfolio repository.
- Permissions: **Contents: Read and write**.

Paste it into `/admin.html` → **Settings** when saving. You can keep **Remember token** off if you want to paste it only when needed.

## Tips

- Poster images should be around 1600 px wide.
- Videos should be 1080p H.264 MP4 for smooth playback.
- For YouTube/Vimeo, paste the embed URL into **Embed URL**.
- For Cloudinary direct videos, paste the `.mp4` URL into **Video / image URL**.
