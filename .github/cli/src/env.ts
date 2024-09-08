import fs from "node:fs";

// for local usage you want to set some ENV variables that are natively available in GitHub workflows
// e.g.
/*
# github.context.repo.owner/github.context.repo.repo
GITHUB_REPOSITORY=fdc-viktor-luft/brocolito
GITHUB_TOKEN=ghp_***
# github.context.eventName (e.g. "pull_request" or "push")
GITHUB_EVENT_NAME=pull_request
# the herein JSON file will be parsed and attached to "github.context.payload"
# Leave empty and "github.context.payload" will be an empty object
GITHUB_EVENT_PATH=<path_to_json_file>
*/
export const initEnv = () => {
  if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
};
