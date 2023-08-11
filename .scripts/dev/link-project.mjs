import * as fs from "node:fs/promises";
import * as path from "node:path";
import { linkDependancy, linkPackage } from "../linking.mjs";
import { enumeratePackages } from "../util.mjs";
import { parseArgs } from "node:util";

const args = parseArgs({
	args: process.argv,
	options: {
		all: {
			short: "a",
			type: "boolean",
		},
	},
	strict: false,
	allowPositionals: true,
});

let argPath = args.positionals[2];
if (!argPath) {
	console.error("Error: Missing path to project directory");
	process.exit(1);
}

const linkAll = args.values.all;

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

console.log(`Linking ${linkAll ? "all " : ""}packages to ${projectName} (${projectPath})\n`);

let hadFailures = false;
let succeeded = 0;

let wants = new Map();

if (linkAll) {
	wants = packages;
} else {
	for (const dependency of dependencies) {
		if (packages.has(dependency)) {
			wants.set(dependency, packages.get(dependency));
		}
	}
}

const linkPromises = [];
for (const [, info] of wants) {
	linkPromises.push(linkPackage(info.path));
}

await Promise.all(linkPromises);

for (const [name] of wants) {
	const success = await linkDependancy(projectPath, name);

	if (success) {
		console.log(`✔ Linked: ${name}`);
		succeeded++;
	} else {
		console.error(`✗ Failed to link ${name}`);
		hadFailures = true;
	}
}

const relativeProjectPath = path.relative(process.cwd(), projectPath);

if (hadFailures) {
	console.log(`\nNot all packages were successfully linked to ${projectName}`);
	console.log(
		`To attempt to undo this action now or at a later time, run "yarn dev:unlink-project ${relativeProjectPath}"`,
	);
} else {
	console.log(
		`\nSuccessfully linked ${succeeded} ${
			succeeded == 1 ? "package" : "packages"
		} to ${projectName}, to later undo this action run "yarn dev:unlink-project ${relativeProjectPath}"`,
	);
}

if (!linkAll) {
	console.log(
		"Note: To link all packages to a project instead of just ones it depends on, specify the --all flag when linking",
	);
}
