# Development and Contributing

This repo provides scripts for automatically linking and unlinking local development copies to and from end user packages, and scripts for automatically building all packages that are relevant to do so.

## Repository info

Packages from this repository get published to Github Packages from their master branch states by an automatic CI workflow.
Packages which are supported for third party use get identically published to NPM under the @seventv scope.

## Developer tooling

This repository provides multiple tools to make co-development of packages easier.

-   `yarn dev:link`: Links all of this repo's packages to your yarn config, so they can be manually linked into projects using `yarn link <package>`
-   `yarn dev:unlink`: Unlinks all of this repo's packages from your yarn config
-   `yarn dev:link-project <path to project>`: Links all packages which the specified project depends on to the local versions in this repo, specify the `--all` option to link every package in this repo to the target project, even if they are not dependencies.
-   `yarn dev:unlink-project <path to project>`: Unlinks all packages which were previously linked to the specified project from this repo, specify the `--skip-reinstall` parameter to avoid refetching live versions of the packages after unlinking, if this is skipped you may need to manually run `yarn install --check-files` to ensure any dangling or old links get dropped, and yarn fetches packages that are no longer linked.
-   `yarn dev:bump-project-locks <path to project>`: Automatically bumps any dependency packages from this repo in the specified project's `yarn.lock` file, does not modify project manifest only bumps the static version the lockfile locks to, to the most recent one which now satisfies the dependency's constraints.

## Workspaces

When new packages are created they should be defined in the `workspaces` field in the root `package.json` for the repository so that npm will resolve internal dependancies correctly.

## Package versioning

Internal packages should version themselves with semantic versioning.

Internal packages should only depend on MAJOR version numbers for other internal packages.

End User packages like Website and Extension should depend on MAJOR and MINOR versions but not PATCH versions.

Major versions should be bumped when packages have breaking changes or otherwise change their shape in a way that breaks or requires changes in other component internal packages.

Minor versions should be bumped when packages change their shape, or otherwise change their implementation details, but not in a way that requires other internal components to be updated.

Patch versions should not be bumped manually, the CI builder should automatically publish a package to the next available patch number whenever a new commit is pushed to the master branch.
