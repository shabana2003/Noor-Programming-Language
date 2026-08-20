const test = require("node:test");
const assert = require("node:assert");

const {
    Program,
    VariableDeclaration,
    VariableUpdate,
    VariableReference,
    NumberLiteral,
    TextLiteral,
    BooleanLiteral,
    NothingLiteral,
    UnaryExpression,
    BinaryExpression,
    LogicalExpression,
    ShowStatement,
    IfStatement
} = require("../src/ast/ast");

const Lexer = require("../src/lexer/Lexer");
const Parser = require("../src/parser/parser");

test("AST nodes are instances of corresponding classes", () => {
    const lexer = new Lexer("age := 22");
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert(ast instanceof Program);
    assert.strictEqual(ast.body.length, 1);
    assert(ast.body[0] instanceof VariableDeclaration);
    assert.strictEqual(ast.body[0].name, "age");
    assert(ast.body[0].value instanceof NumberLiteral);
    assert.strictEqual(ast.body[0].value.value, 22);
});

test("AST parses boolean literals (yes / no)", () => {
    const lexer = new Lexer("flag := yes\nactive := no");
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert(ast.body[0] instanceof VariableDeclaration);
    assert(ast.body[0].value instanceof BooleanLiteral);
    assert.strictEqual(ast.body[0].value.value, true);

    assert(ast.body[1] instanceof VariableDeclaration);
    assert(ast.body[1].value instanceof BooleanLiteral);
    assert.strictEqual(ast.body[1].value.value, false);
});

test("AST parses nothing literal", () => {
    const lexer = new Lexer("empty := nothing");
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert(ast.body[0] instanceof VariableDeclaration);
    assert(ast.body[0].value instanceof NothingLiteral);
    assert.strictEqual(ast.body[0].value.value, null);
});

test("AST parses unary expressions", () => {
    const lexer = new Lexer("val := not yes");
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert(ast.body[0].value instanceof UnaryExpression);
    assert.strictEqual(ast.body[0].value.operator, "not");
    assert(ast.body[0].value.operand instanceof BooleanLiteral);
});

test("AST parses full if-else statement with block statements", () => {
    const code = `
age := 22
if age > 18:
    show "Adult"
    show "Allowed"
else:
    show "Not allowed"
`;
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert(ast instanceof Program);
    assert(ast.body[0] instanceof VariableDeclaration);
    const ifStmt = ast.body[1];
    assert(ifStmt instanceof IfStatement);
    assert(ifStmt.condition instanceof BinaryExpression);
    assert.strictEqual(ifStmt.body.length, 2);
    assert(ifStmt.body[0] instanceof ShowStatement);
    assert(ifStmt.body[1] instanceof ShowStatement);
    assert.strictEqual(ifStmt.elseBody.length, 1);
    assert(ifStmt.elseBody[0] instanceof ShowStatement);
});
