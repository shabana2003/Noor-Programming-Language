#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const Compiler = require("../src/compiler/compiler");

function printHelp() {
    console.log(`
Noor Programming Language Compiler

Usage:
  noor <file.noor>                 Compile and run <file.noor>
  noor run <file.noor>             Compile and run <file.noor>
  noor build <file.noor> [-o out]  Compile <file.noor> to executable binary
  noor --help, -h                  Show this help message
  noor --version, -v               Show version
`);
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printHelp();
        process.exit(args.length === 0 ? 1 : 0);
    }

    if (args.includes("--version") || args.includes("-v")) {
        const pkg = require("../package.json");
        console.log(`Noor Compiler v${pkg.version}`);
        process.exit(0);
    }

    let command = "run";
    let targetFile = null;
    let outputFile = null;

    if (args[0] === "build" || args[0] === "run") {
        command = args[0];
        targetFile = args[1];
        if (command === "build" && (args[2] === "-o" || args[2] === "--output")) {
            outputFile = args[3];
        }
    } else {
        targetFile = args[0];
        if (args[1] === "-o" || args[1] === "--output") {
            command = "build";
            outputFile = args[2];
        } else {
            command = "run";
        }
    }

    if (!targetFile) {
        console.error("Error: No input file specified.");
        process.exit(1);
    }

    if (!targetFile.endsWith(".noor")) {
        console.error("Error: Noor source files must have the '.noor' extension.");
        process.exit(1);
    }

    const resolvedPath = path.resolve(process.cwd(), targetFile);

    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found: ${targetFile}`);
        process.exit(1);
    }

    const source = fs.readFileSync(resolvedPath, "utf8");
    const filename = path.basename(targetFile);

    if (!outputFile) {
        const parsed = path.parse(targetFile);
        outputFile = path.join(parsed.dir, parsed.name);
    }

    const compiler = new Compiler();

    try {
        if (command === "run") {
            const result = compiler.run(source, filename);
            if (result.stdout) {
                process.stdout.write(result.stdout);
            }
            if (result.stderr) {
                process.stderr.write(result.stderr);
            }
            process.exit(result.exitCode);
        } else {
            const resolvedOutPath = path.resolve(process.cwd(), outputFile);
            compiler.compileToNative(source, resolvedOutPath, filename);
            console.log(`Compiled '${targetFile}' -> '${outputFile}'`);
        }
    } catch (err) {
        if (err.name === "SemanticError" || err.message.startsWith("Unexpected token") || err.message.startsWith("Expected") || err.message.startsWith("Invalid indentation") || err.message.startsWith("Unterminated string")) {
            console.error(`Error: ${err.message}`);
        } else if (err.stderr) {
            console.error(`Compilation Error:\n${err.stderr.toString()}`);
        } else {
            console.error(`Error: ${err.message}`);
        }
        process.exit(1);
    }
}

main();
