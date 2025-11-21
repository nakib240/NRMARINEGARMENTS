IMAGES — how to add local product photos

Overview
- The catalog (`script_final.js`) prefers local images placed in the project `images/` folder but uses remote Unsplash fallbacks when local files are missing.

Recommended filenames (place in project root `images/`):
- Shirt: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQJVlPcewBwoH0dgmlp5djth4PS5b-1FrFDg&s`, `shirt-2.jpg`
- Jeans: `jeans-1.jpg`, `jeans-2.jpg`
- Gabardine (pants): `gavading-1.jpg`, `gavading-2.jpg`

Quick PowerShell commands (run from project root `c:\Users\acer\Desktop\NRMARINEGARMENTS`):

```powershell
# create images folder if needed
if (-not (Test-Path -Path .\images)) { New-Item -ItemType Directory -Path .\images }

# copy all files from your desktop folder (adjust path as needed)
Copy-Item -Path 'C:\Users\acer\Desktop\PIcs\*' -Destination .\images\
```

Notes and tips
- The script uses local paths like `images/shirt-1.jpg`. Make sure filenames match exactly (case-insensitive on Windows but keep names consistent).
- If you prefer to use other hosted images, replace the URLs inside `script_final.js` under the `images` array for each product.
- Avoid hotlinking copyrighted images from Google Images. Prefer free sources like Unsplash, Pexels, or use your own assets.

How to update images in code (example)
- Open `script_final.js` and find the product entry for `Gabardine Pant`.
- Replace an entry in `images: [ ... ]` with a local filename (example: `'images/gavading-1.jpg'`).

If you want, I can:
- Create the `images/` folder and place placeholder images for you.
- Copy files from your Desktop `PIcs` if you grant the path (I can run the PowerShell commands here if allowed).

That's it — place the images and reload `index.html` in your browser to see them appear in the product gallery.