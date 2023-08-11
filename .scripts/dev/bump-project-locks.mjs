import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { enumeratePackages, resolveExitCode } from "../util.mjs";
import { parseArgs } from "node:util";

const args = parseArgs({
	args: process.argv,
	options: {},
	strict: false,
	allowPositionals: true,
});

let argPath = args.positionals[2];
if (!argPath) {
	console.error("Error: Missing path to project directory");
	process.exit(1);
}

const projectPath = path.resolve(argPath);
const manifestPath = path.resolve(projectPath, "package.json");

let manifest;
let projectName;
let dependencies;
try {
	const manifestFile = await fs.readFile(manifestPath, { encoding: "utf-8" });

	manifest = JSON.parse(manifestFile);
	projectName = manifest.name;

	if (!projectName) throw 0;

	dependencies = [
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.devDependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
		...Object.keys(manifest.bundleDependencies ?? {}),
		...Object.keys(manifest.optionalDependencies ?? {}),
	];
} catch (err) {
	console.error("Error: Failed to parse destination project manifest (Are you sure the destination is a package?)");
	process.exit(1);
}

const packages = await enumeratePackages();

console.log(`Bumping yarn.lock for packages from this repository in ${projectName} (${projectPath})\n`);

let wants = [];

for (const dependency of dependencies) {
	if (packages.has(dependency)) {
		wants.push(dependency);
	}
}

if (wants.length > 0) {
	const yarnUpgrade = child_process.spawn("yarn", ["upgrade", ...wants], {
		stdio: "inherit",
	});

	if ((await resolveExitCode(yarnUpgrade)) == 0) {
		console.log(`\nSuccessfully bumped ${wants.length} packages in ${projectName}`);
	} else {
		console.error("\nFailed to bump package versions, see above yarn output for details");
	}
} else {
	console.error(`\nNo packages to bump found in ${projectName}`);
}
