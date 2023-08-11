import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as semver from "semver";
import promiseSpawn from "@npmcli/promise-spawn";
import validateName from "validate-npm-package-name";

export async function enumeratePackages(directory = "./") {
	const packages = new Map();

	const root = await fs.opendir(directory, { withFileTypes: true });

	for await (const entity of root) {
		if (!entity.isDirectory()) continue;
		if (entity.name.startsWith(".")) continue;

		const absPath = path.resolve(root.path, entity.name);
		const manifestPath = path.resolve(absPath, "package.json");

		try {
			const manifest = await fs.readFile(manifestPath, { encoding: "utf-8" });
			const json = JSON.parse(manifest);

			const name = json.name;
			if (!name) continue;

			const nameValidation = validateName(name);
			if (!nameValidation.validForNewPackages) continue;

			const version = semver.coerce(json.version);
			if (!version) continue;

			packages.set(name, {
				version,
				path: absPath,
				manifest: json,
				manifestPath,
			});
		} catch (err) {
			continue;
		}
	}

	return packages;
}

export async function getLatestPackageTime(pkg, range) {
	const nameValidation = validateName(pkg);
	if (!nameValidation.validForNewPackages) {
		throw new SyntaxError("Package name not valid.");
	}

	const semverRange = semver.validRange(range);
	if (!semverRange) {
		throw new SyntaxError("Version range not valid.");
	}

	try {
		const npmCommand = await promiseSpawn("npm", ["view", pkg, "time", "--json"], {
			timeout: 60000,
		});

		const versionTimes = JSON.parse(npmCommand.stdout);

		const highestMatch = semver.maxSatisfying(Object.keys(versionTimes), semverRange);

		if (highestMatch) {
			const matchTime = new Date(versionTimes[highestMatch]);
			if (isNaN(matchTime)) throw new Error("Failed to parse remote version time");

			const semverVersion = semver.parse(highestMatch);
			if (!semverVersion) throw new Error("Failed to parse remote version string");

			return {
				version: semverVersion,
				time: matchTime,
			};
		}
	} catch {
		void 0;
	}

	return null;
}

export async function getLastCommit(location) {
	const absPath = path.resolve(location);

	try {
		const gitCommand = await promiseSpawn("git", ["log", "-n 1", "--pretty=format:%H,%ct", absPath]);

		const respValues = gitCommand.stdout.split(",");
		if (respValues.length == 0) throw 0;

		const hash = respValues[0];
		const time = new Date(respValues[1] * 1000);
		if (!hash || isNaN(time)) throw 0;

		return {
			hash,
			time,
		};
	} catch {
		void 0;
	}

	return null;
}

export function resolveExitCode(child) {
	return new Promise((resolve) => {
		child.on("exit", (code) => resolve(code));
	});
}
