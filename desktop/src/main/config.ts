/** Client id of the GitHub OAuth app (device flow enabled); set once the app is registered (#44). */
export const GITHUB_CLIENT_ID = process.env.GESTAO_GITHUB_CLIENT_ID ?? "";

export const SITE_REMOTE_URL =
  "https://github.com/giovanebribeiro/site-amanda-boaviagem.git";

export const SITE_CLONE_FOLDER = "site";

export const GITHUB_LOGIN_ORIGIN = "https://github.com";

export const SITE_REPO = SITE_REMOTE_URL.replace(
  /^https:\/\/github\.com\/(.+)\.git$/,
  "$1",
);

export const PUBLISH_WORKFLOW_FILE = "publish-site.yml";
