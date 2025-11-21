Pushing repository to GitHub — instructions for Windows PowerShell

Important: I cannot push from this environment because I don’t have your Git credentials or external network access. Follow the steps below in your local shell (PowerShell) to push the repo to GitHub.

1) Check the current git status and remote

```powershell
cd C:\Users\acer\Desktop\NRMARINEGARMENTS
git status
git remote -v
```

2) If you don't have `origin` set, add it (HTTPS):

```powershell
git remote add origin https://github.com/nakib240/NRMARINEGARMENTS.git
```

(If you prefer SSH and already set up an SSH key on GitHub, use the SSH remote instead: `git remote add origin git@github.com:nakib240/NRMARINEGARMENTS.git`)

3) Stage the files you want to push (recommended: images and service helpers). Adjust as needed.

```powershell
# Stage only the images directory and service helper files
git add images/
git add README_SERVICE.md nssm_install.ps1 service-install-node-windows.js

# Or stage everything
# git add .
```

4) Commit the changes

```powershell
git commit -m "Add static images and service helper scripts"
```

5) Push to GitHub

- If `main` is your branch and remote is `origin`:

```powershell
git push -u origin main
```

- If you are prompted for credentials, you can use:
  - HTTPS: your GitHub username and a Personal Access Token (PAT) as the password (recommended over password). Generate a PAT at https://github.com/settings/tokens with `repo` scope.
  - Or use SSH (recommended long-term): set up an SSH key and add it to your GitHub account.

Helpful alternatives (avoid exposing token in shell history):

- Use Git Credential Manager (GCM) — it will handle credentials securely.
- For a one-off push using PAT (not recommended because it stores token in shell history):

```powershell
git push https://<USERNAME>:<PERSONAL_ACCESS_TOKEN>@github.com/nakib240/NRMARINEGARMENTS.git
```

6) Verify on GitHub and redeploy

- Visit: https://github.com/nakib240/NRMARINEGARMENTS to verify the files uploaded.
- If you deploy the frontend on Vercel, trigger a redeploy after the push so `images/` are included in the build.

Notes & Troubleshooting

- If you see `error: failed to push some refs`, run `git pull --rebase origin main` first, resolve conflicts, then `git push`.
- If `images/` are large or you prefer not to commit them, consider uploading images to external storage (Supabase Storage, S3) and update `script.js` image URLs accordingly.
- If pushing fails due to LFS needs or very large files, consider using Git LFS.

If you want, I can prepare a ready `git` commit patch you can apply locally (I can create the patch files here). Tell me which files exactly you want staged and I’ll produce the patch.