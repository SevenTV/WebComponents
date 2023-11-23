# Development and Contributing

This repo provides scripts for automatically linking and unlinking local development copies to and from end user packages, and scripts for automatically building all packages that are relevant to do so.

## Repository info

Packages from this repository get published to Github Packages from their master branch states by an automatic CI workflow.
Packages which are supported for third party use get identically published to NPM under the @seventv scope.

When packages get published a tag will be automatically created at the commit the publisher used to make the release.

## Git Cloning

It is recommended to fetch this repository without tags by default, you can accomplish this by cloning the repository with `git clone --no-tags`.
If you already cloned the repository you can disable future tag fetches by running `git config --add remote.origin.tagOpt "--no-tags"`, you will need to manually delete any tags you already fetched after this.

To fetch a tag manually with this enabled you can either force fetch all tags by running `git fetch --tags` or you can fetch it directly using `git fetch origin +refs/tags/<tagname>:refs/tags/<tagname>`.

If you are using VSCode, it will automatically force fetch tags regardless of git preferences, to disable this make sure the `git.pullTags` setting is disabled for this workspace. This is already specified in the repository local `.vscode/settings.json` so if you do not want this behavior and instead do want to always fetch all tags you will need to override it.

## Developer tooling

This repository provides multiple tools to make co-development of packages easier.

-   `yarn dev:link`: Links all of this repo's packages to your yarn config, so they can be manually linked into projects using `yarn link <package>`
-   `yarn dev:unlink`: Unlinks all of this repo's packages from your yarn config
-   `yarn dev:link-project <path to project>`: Links all packages which the specified project depends on to the local versions in this repo, specify the `--all` option to link every package in this repo to the target project, even if they are not dependencies.
-   `yarn dev:unlink-project <path to project>`: Unlinks all packages which were previously linked to the specified project from this repo, specify the `--skip-reinstall` parameter to avoid refetching live versions of the packages after unlinking, if this is skipped you may need to manually run `yarn install --check-files` to ensure any dangling or old links get dropped, and yarn fetches packages that are no longer linked.
-   `yarn dev:bump-project-locks <path to project>`: Automatically bumps any dependency packages from this repo in the specified project's `yarn.lock` file, does not modify project manifest only bumps the static version the lockfile locks to, to the most recent one which now satisfies the dependency's constraints.
-   `yarn gh-packages-key`: Append GitHub Packages read token to your local .npmrc, this allows you to fetch unresolvable packages if a package in this repository depends on a version which cannot be satisfied by the local versions at your HEAD.
-   `yarn gh-packages-key:undo`: Removes GitHub Packages read token from your local .npmrc so you can commit the file if changes need to be made to the base .npmrc

## Workspaces

All packages are captured by the `workspaces` field in the root `package.json` for the repository so that npm will resolve internal dependancies correctly.

## Package versioning

Internal packages should version themselves with semantic versioning.

Internal packages should only depend on MAJOR version numbers for other internal packages.

End User packages like Website and Extension should depend on MAJOR and MINOR versions but not PATCH versions.

Major versions should be bumped when packages have breaking changes or otherwise change their shape in a way that breaks or requires changes in other component internal packages.

Minor versions should be bumped when packages change their shape, or otherwise change their implementation details, but not in a way that requires other internal components to be updated.

Patch versions should not be bumped manually, the CI builder should automatically publish a package to the next available patch number whenever a new commit is pushed to the master branch.
