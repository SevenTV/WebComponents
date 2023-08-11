import * as fs from "node:fs/promises";
import * as path from "node:path";
import promiseSpawn from "@npmcli/promise-spawn";
import validateName from "validate-npm-package-name";

export async function linkPackage(location) {
	const absPath = path.resolve(location);

	try {
		await promiseSpawn("yarn", ["link"], { cwd: absPath });

		return true;
	} catch {
		void 0;
	}

	return false;
}

export async function unlinkPackage(location) {
	const absPath = path.resolve(location);

	try {
		await promiseSpawn("yarn", ["unlink"], { cwd: absPath });

		return true;
	} catch {
		void 0;
	}

	return false;
}

export async function linkDependancy(location, pkg) {
	const absPath = path.resolve(location);

	const nameValidation = validateName(pkg);
	if (!nameValidation.validForNewPackages) {
		throw new SyntaxError("Package name not valid.");
	}

	try {
		await promiseSpawn("yarn", ["link", pkg], { cwd: absPath });

		return true;
	} catch {
		void 0;
	}

	return false;
}

export async function unlinkDependancy(location, pkg) {
	const absPath = path.resolve(location);

	const nameValidation = validateName(pkg);
	if (!nameValidation.validForNewPackages) {
		throw new SyntaxError("Package name not valid.");
	}

	try {
		await promiseSpawn("yarn", ["unlink", pkg], { cwd: absPath });

		return true;
	} catch {
		void 0;
	}

	return false;
}

export async function hasDependancyLink(location, pkg) {
	const absPath = path.resolve(location);

	const nameValidation = validateName(pkg);
	if (!nameValidation.validForNewPackages) {
		throw new SyntaxError("Package name not valid.");
	}

	const depPath = path.resolve(absPath, "node_modules/", pkg);

	try {
		const depStat = await fs.lstat(depPath);

		if (depStat.isSymbolicLink()) {
			return true;
		}
	} catch {
		void 0;
	}

	return false;
}
