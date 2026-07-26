// Matches the git tags this project releases under (see the "Bump changelog"
// commits and .github/workflows/build-deploy-production.yml), which are also
// the CHANGELOG.md section headings -- so a tag is always a valid ref for a
// GitHub blob URL pinned to that exact release.
const RELEASE_TAG_PATTERN = /^v\d+\.\d+\.\d+$/;

const REPO_URL = 'https://github.com/winds-mobi/winds-mobi-client-web';

// A build's version is only a real release tag when built by the release
// workflow; local/dev/PR-preview builds fall back to `main` so the link
// still resolves to something real on GitHub.
export function changelogUrlForVersion(version: string): string {
  const ref = RELEASE_TAG_PATTERN.test(version) ? version : 'main';

  return `${REPO_URL}/blob/${ref}/CHANGELOG.md`;
}
