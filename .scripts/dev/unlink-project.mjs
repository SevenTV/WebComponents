import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { hasDependancyLink, unlinkDependancy } from "../linking.mjs";
import { enumeratePackages, resolveExitCode } from "../util.mjs";
import { parseArgs } from "node:util";

const args = parseArgs({
	args: process.argv,
	options: {
		"skip-reinstall": {
			short: "s",
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

const skipReinstall = args.values["skip-reinstall"];

const projectPath = path.resolve(argPath);
const manifestPath = path.resolve(projectPath, "package.json");

let manifest;
let projectName;
try {
	const manifestFile = await fs.readFile(manifestPath, { encoding: "utf-8" });

	manifest = JSON.parse(manifestFile);
	projectName = manifest.name;

	if (!projectName) throw 0;
} catch (err) {
	console.error("Error: Failed to parse destination project manifest (Are you sure the destination is a package?)");
	process.exit(1);
}

const packages = await enumeratePackages();

let hadFailures = false;
let succeeded = 0;

console.log(`Unlinking packages in this repository from ${projectName} (${projectPath})\n`);

for (const [name] of packages) {
	const hasLink = await hasDependancyLink(projectPath, name);
	const success = await unlinkDependancy(projectPath, name);

	if (hasLink) {
		if (success) {
			console.log(`✔ Unlinked: ${name}`);
			succeeded++;
		} else {
			console.error(`✗ Failed to unlink ${name}`);
			hadFailures = true;
		}
	}
}

if (!skipReinstall && succeeded > 0) {
	console.log(
		"\nRefetching unlinked packages and destroying hanging links, specify the --skip-reinstall option to skip this step",
	);

	const yarnCheck = child_process.spawn("yarn", ["install", "--check-files"], {
		stdio: "inherit",
	});

	if ((await resolveExitCode(yarnCheck)) != 0) {
		console.log(
			'\nFailed to automatically refetch unlinked packages, you may need to run "yarn install --check-files" manually',
		);
	}
}

if (hadFailures) {
	console.log("\nNot all packages were successfully unlinked.");
} else {
	console.log(`\nSuccessfully unlinked ${succeeded} ${succeeded == 1 ? "package" : "packages"} from ${projectName}`);
}

if (skipReinstall) {
	console.log(
		'Note: Did not automatically refetch unlinked packages, you may need to run "yarn install --check-files" manually',
	);
}
