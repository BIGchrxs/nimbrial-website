# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub instead:

1. Go to the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, how to reproduce it, and its potential impact.

We will acknowledge your report as soon as we can and keep you updated until the issue is resolved.

## Supported versions

Only the latest version on the `main` branch, which is what runs on the live site, receives security fixes.

## How this repository is protected

- **CodeQL** scans the site's TypeScript and the GitHub Actions workflows on every pull request, every push to `dev` and `main`, and weekly.
- **Dependency review** blocks pull requests that introduce high or critical vulnerabilities.
- **npm audit** fails the build on any known vulnerability in production dependencies, and on high or critical issues in build tooling.
- **Secret scanning with push protection** blocks commits that contain credentials.
- All third-party GitHub Actions are pinned to full commit SHAs.
