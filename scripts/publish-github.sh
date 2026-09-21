#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_name="$(basename "$project_dir" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g')"

if [[ -z "$repo_name" ]]; then
  echo "Could not derive a repository name from: $project_dir" >&2
  exit 1
fi

cd "$project_dir"
git rev-parse --is-inside-work-tree >/dev/null
git branch -M main

if git remote get-url origin >/dev/null 2>&1; then
  echo "origin already exists; this script only creates a new repository." >&2
  exit 1
fi

command -v gh >/dev/null
gh auth status >/dev/null

# Catch root-relative navigation and asset mistakes before creating public state.
VITE_BASE_PATH="/$repo_name/" npm run build

mkdir -p .github/workflows
cat > .github/workflows/deploy-pages.yml <<YAML
name: Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_PATH: /$repo_name/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
YAML

git add -A
if ! git diff --cached --quiet; then
  git commit -m "Prepare GitHub Pages deployment"
fi

owner="$(gh api user --jq .login)"
gh repo create "$owner/$repo_name" --public --source=. --remote=origin --push
gh api --method POST "repos/$owner/$repo_name/pages" -f build_type=workflow
gh workflow run deploy-pages.yml --repo "$owner/$repo_name"

echo "Repository: https://github.com/$owner/$repo_name"
echo "Pages deployment started. Verify it with: gh run list --repo $owner/$repo_name --workflow deploy-pages.yml --limit 1"
