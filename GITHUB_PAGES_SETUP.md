# AFTERCARE OS — GITHUB PAGES SETUP

The repository is prepared for GitHub Pages with GitHub Actions.

## One-time setup

1. Create a new GitHub repository named:
   `aftercare-os`

2. Upload the complete contents of this package to the repository root.
   Make sure `.github/workflows/pages.yml` is included.

3. In GitHub open:
   **Settings → Pages**

4. Under **Build and deployment / Source**, choose:
   **GitHub Actions**

5. Push / commit to `main`.

GitHub Actions will deploy the site automatically.

## Expected URL

If the GitHub username is `dfluch-hub` and the repository is `aftercare-os`:

`https://dfluch-hub.github.io/aftercare-os/`

The app uses relative paths, so it is compatible with a project subdirectory.

## Future custom domain

Later you can point a domain such as:
`aftercareos.com`

to GitHub Pages without changing the app architecture.

## Updates

Every future push to `main` automatically publishes the newest version.

That gives us:
- version history
- rollback capability
- automatic deployment
- no manual re-upload to a hosting provider
