const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const Lexer = require("../lexer/Lexer");
const Parser = require("../parser/parser");
const { SemanticAnalyzer } = require("../semantic/SemanticAnalyzer");
const LLVMCodegen = require("../codegen/llvmCodegen");

class Compiler {
    constructor(options = {}) {
        this.options = options;
    }

    compileToLLVM(source, filename = "main.noor") {
        const lexer = new Lexer(source);
        const tokens = lexer.tokenize();

        const parser = new Parser(tokens);
        const ast = parser.parse();

        const analyzer = new SemanticAnalyzer(ast, filename);
        const { ast: analyzedAST } = analyzer.analyze();

        const codegen = new LLVMCodegen(analyzedAST);
        const llvmIR = codegen.generate();

        return {
            tokens,
            ast: analyzedAST,
            llvmIR
        };
    }

    compileToNative(source, outputPath, filename = "main.noor") {
        const { llvmIR } = this.compileToLLVM(source, filename);

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "noor-"));
        const tmpLLPath = path.join(tmpDir, "output.ll");

        try {
            fs.writeFileSync(tmpLLPath, llvmIR, "utf8");

            const clangArgs = ["-Wno-override-module", tmpLLPath, "-o", outputPath];
            execFileSync("clang", clangArgs, { stdio: "pipe" });

            return {
                outputPath,
                llvmIR
            };
        } finally {
            if (fs.existsSync(tmpLLPath)) {
                fs.unlinkSync(tmpLLPath);
            }
            if (fs.existsSync(tmpDir)) {
                fs.rmdirSync(tmpDir);
            }
        }
    }

    run(source, filename = "main.noor") {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "noor-run-"));
        const tmpBinPath = path.join(tmpDir, "program");

        try {
            this.compileToNative(source, tmpBinPath, filename);
            const result = execFileSync(tmpBinPath, [], {
                encoding: "utf8",
                stdio: ["pipe", "pipe", "pipe"]
            });

            return {
                stdout: result,
                stderr: "",
                exitCode: 0
            };
        } catch (err) {
            if (err.stdout !== undefined) {
                return {
                    stdout: err.stdout.toString(),
                    stderr: err.stderr.toString(),
                    exitCode: err.status ?? 1
                };
            }
            throw err;
        } finally {
            if (fs.existsSync(tmpBinPath)) {
                fs.unlinkSync(tmpBinPath);
            }
            if (fs.existsSync(tmpDir)) {
                fs.rmdirSync(tmpDir);
            }
        }
    }
}

module.exports = Compiler;
