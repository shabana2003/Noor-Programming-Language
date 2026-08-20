const test = require("node:test");
const assert = require("node:assert");

const Lexer = require("../src/lexer/Lexer");
const Parser = require("../src/parser/parser");
const { SemanticAnalyzer, SemanticError } = require("../src/semantic/SemanticAnalyzer");

function analyzeCode(code, filename = "test.noor") {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const analyzer = new SemanticAnalyzer(ast, filename);
    return analyzer.analyze();
}

test("semantic analyzer passes valid variable declaration and usage", () => {
    const code = `
age := 22
show age
age <- 25
show age
`;
    assert.doesNotThrow(() => analyzeCode(code));
});

test("semantic analyzer detects undeclared variable in show", () => {
    const code = `
show age
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("Undefined variable 'age'"));
            assert.strictEqual(err.line, 2);
            return true;
        }
    );
});

test("semantic analyzer detects undeclared variable in update", () => {
    const code = `
age <- 25
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("Undefined variable 'age'"));
            return true;
        }
    );
});

test("semantic analyzer detects duplicate variable declaration in same scope", () => {
    const code = `
age := 22
age := 25
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("already declared"));
            return true;
        }
    );
});

test("semantic analyzer detects type mismatch on variable update", () => {
    const code = `
age := 22
age <- "twenty five"
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("Type mismatch"));
            return true;
        }
    );
});

test("semantic analyzer detects arithmetic type errors", () => {
    const code = `
result := 10 + "hello"
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("Arithmetic operator '+' expects NUMBER"));
            return true;
        }
    );
});

test("semantic analyzer detects invalid if condition type", () => {
    const code = `
age := 22
if age:
    show "Adult"
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("If condition must evaluate to BOOLEAN"));
            return true;
        }
    );
});

test("semantic analyzer supports nested scopes in if-else blocks", () => {
    const code = `
age := 22
if age > 18:
    message := "Adult"
    show message
else:
    otherMessage := "Minor"
    show otherMessage
`;
    assert.doesNotThrow(() => analyzeCode(code));
});

test("semantic analyzer catches variables declared inside if-block accessed outside", () => {
    const code = `
age := 22
if age > 18:
    inner := "Allowed"
show inner
`;
    assert.throws(
        () => analyzeCode(code),
        (err) => {
            assert(err instanceof SemanticError);
            assert(err.message.includes("Undefined variable 'inner'"));
            return true;
        }
    );
});
