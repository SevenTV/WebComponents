import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as semver from "semver";
import { enumeratePackages, getLastCommit, getLatestPackageTime, resolveExitCode } from "../util.mjs";
import promiseSpawn from "@npmcli/promise-spawn";

console.log("Starting CI publisher workflow");

const globalLicensePath = path.resolve("LICENSE.md");

const packages = await enumeratePackages();

for (const [name, info] of packages) {
	let writeBackManifest = false;

	const lastCommit = await getLastCommit(info.path);
	if (!lastCommit) continue;

	const lastPublished = await getLatestPackageTime(name, `~${info.version.major}.${info.version.minor}`);

	const pinnedVersion = info.manifest.webComponentsConfig?.pinnedVersion ?? info.version.patch != 0;

	if (lastPublished) {
		if (lastPublished.time.getTime() >= lastCommit.time.getTime()) {
			continue;
		}

		if (pinnedVersion) {
			if (semver.eq(info.version, lastPublished.version)) {
				continue;
			}
		} else {
			const nextPatch = lastPublished.version.patch + 1;

			info.version.patch = nextPatch;
			info.manifest.version = info.version.format();
			writeBackManifest = true;
		}
	}

	console.log(`\nPublishing ${name} at version ${info.version.format()}`);

	const tagName = `${name}@${info.version.format()}`;

	console.log(`\nCreating git tag ${tagName}`);

	try {
		await promiseSpawn("git", ["tag", "-f", "-m", "Created by CI publisher", tagName]);
		await promiseSpawn("git", ["push", "-f", "origin", tagName]);
	} catch {
		throw new Error(`Failed to create git tag ${tagName} at ${lastCommit.hash}`);
	}

	if (!info.manifest.license) {
		console.log(`\nCopying license to package`);

		try {
			await fs.copyFile(globalLicensePath, path.resolve(info.path, "LICENSE.md"));
		} catch {
			throw new Error("Failed to copy LICENSE.md to local package");
		}

		info.manifest.license = "SEE LICENSE IN LICENSE.md";
		writeBackManifest = true;
	}

	if (writeBackManifest) {
		console.log("\nWriting back modified manifest to package");

		try {
			await fs.writeFile(info.manifestPath, JSON.stringify(info.manifest), { encoding: "utf-8" });
		} catch {
			throw new Error("Failed to write back manifest file");
		}
	}

	const hasBuildStep = !!info.manifest.scripts?.build;

	if (hasBuildStep) {
		console.log("\nPackage has build step, installing dependencies");

		const yarnDependancies = child_process.spawn("yarn", ["install"], {
			cwd: info.path,
			stdio: "inherit",
		});

		if ((await resolveExitCode(yarnDependancies)) != 0) {
			throw new Error("Failed to install package dependancies");
		}

		console.log("\nBuilding package");

		const yarnBuild = child_process.spawn("yarn", ["build"], {
			cwd: info.path,
			stdio: "inherit",
		});

		if ((await resolveExitCode(yarnBuild)) != 0) {
			throw new Error("Failed to build package");
		}
	}

	console.log("\nPublishing to registry");

	const npmPublish = child_process.spawn("npm", ["publish"], {
		cwd: info.path,
		stdio: "inherit",
	});

	if ((await resolveExitCode(npmPublish)) != 0) {
		throw new Error("Failed to publish to registry");
	}
}
