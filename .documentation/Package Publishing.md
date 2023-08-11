# CI Package Publishing Workflow

The CI should execute the following, either when a commit is pushed to the `master` branch or when manually triggered.

## Marking packages which need to be published

-   Pull current `master` branch.
-   Scan all top level directories of the repository, which do not start with a `.`, and contain a `package.json` in their root.
-   For each matched directory recursively find the latest commit which modified it or any of its contents.
-   For each matched directory parse its package manifest and note it's version.
-   For each package, fetch the latest metadata from the Github Packages registry, finding the highest version that matches the local manifest's MAJOR and MINOR version.
-   For each package find the timestamp the version was built and compare it to the commit date of the latest local commit for that package, if the last commit is newer or no published versions match, mark the package for publishing.

## Publishing marked packages

_Repeat for each package to be published_

-   If the local manifest specifies the non standard flag `webComponentConfig.pinnedVersion` or defines a non-zero PATCH number, and a published version matched that number, skip this package and do nothing.
-   Otherwise if the package does not meet the above criteria, and a published version was matched, increment the PATCH number by one higher than the published version's PATCH number and store it to the local manifest, but do not commit it to the repository.
-   Create a new git tag in the repository at the latest local commit for the package, named with the format `<PACKAGE>@<VERSION>`.
-   If the local manifest does not define a license string, copy the global license for this repository located in LICENSE.md to the package's root directory, and change the string to `SEE LICENSE IN LICENSE.md` and store it in the local manifest.
-   If the package has a build step, install all of its dependancies.
-   Build or transpile the package if neccissary or relevant to do so depending on the package.
-   Publish the package to the Github Packages repository using the workflow's auth token.
-   If the package specifies the non standard flag `webComponentConfig.dualPublish`, modify the local manifest and point the registry to the standard NPM Registry, ensuring access is set to public, and publish the package using the same version number and build results as published on Github Packages. Silently fail if a package with that version already exists.

## Github Packages cleanup (Optional)

_If implemented, the CI should execute the following either after every Publish cycle, or alternatively on a timer._

-   Pull current `master` branch.
-   Query the Github Packages API for every package linked to this repository.
-   Enumerate every published version of selected packages.
-   Scan the local repository for known packages, using the same process described in the [Marking for publish](#marking-packages-which-need-to-be-published) procedure.
-   Find all versions which are NOT the highest PATCH version for any given MAJOR and MINOR version.
-   For any packages which are currently known in the local repository, IGNORE all PATCH versions from the highest TWO MAJOR versions.
-   For any versions which match the above criteria, and are not to be ignored, delete the package versions from the GitHub Packages registry.
-   Always leave the git tags assigned to each PATCH version, even after their packages are deleted. Never revoke packages from the NPM registry.
