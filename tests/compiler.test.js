const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const Compiler = require("../src/compiler/compiler");

test("compiles and runs hello world", () => {
    const code = `
show "Hello, Noor!"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "Hello, Noor!\n");
});

test("compiles and runs variable declaration and updates", () => {
    const code = `
age := 22
show age
age <- 25
show age
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "22\n25\n");
});

test("compiles and runs arithmetic expressions with correct precedence", () => {
    const code = `
a := 10 + 5 * 2
b := (10 + 5) * 2
c := 10 / 2
d := 10 % 3
show a
show b
show c
show d
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "20\n30\n5\n1\n");
});

test("compiles and runs boolean and nothing values", () => {
    const code = `
show yes
show no
show nothing
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "yes\nno\nnothing\n");
});

test("compiles and runs if-else statements", () => {
    const code = `
age := 22
if age > 18:
    show "Adult"
    show "Allowed"
else:
    show "Not allowed"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "Adult\nAllowed\n");
});

test("compiles and runs else branch when condition is false", () => {
    const code = `
age := 15
if age > 18:
    show "Adult"
else:
    show "Minor"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "Minor\n");
});

test("compiles and runs nested conditionals and logical expressions", () => {
    const code = `
score := 85
isMember := yes

if score >= 80 and isMember:
    show "Eligible for discount"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "Eligible for discount\n");
});

test("compiles and runs unary not and or expressions", () => {
    const code = `
flag := not yes
show flag
if flag or yes:
    show "Logical OR works"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "no\nLogical OR works\n");
});

test("compiles and runs string equality comparisons", () => {
    const code = `
greeting := "hello"
if greeting == "hello":
    show "Matches"
if greeting != "world":
    show "Different"
`;
    const compiler = new Compiler();
    const result = compiler.run(code);

    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.stdout, "Matches\nDifferent\n");
});

test("CLI binary runs example files correctly", () => {
    const cliPath = path.resolve(__dirname, "../bin/noor.js");
    const examplePath = path.resolve(__dirname, "../examples/hello.noor");

    const output = execFileSync("node", [cliPath, "run", examplePath], {
        encoding: "utf8"
    });

    assert.strictEqual(output, "Hello,noor\n");
});

test("CLI rejects non-noor extensions", () => {
    const cliPath = path.resolve(__dirname, "../bin/noor.js");

    assert.throws(() => {
        execFileSync("node", [cliPath, "test.js"], {
            encoding: "utf8",
            stdio: "pipe"
        });
    });
});
