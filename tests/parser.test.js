const test = require("node:test");
const assert = require("node:assert");

const Lexer = require("../src/lexer/Lexer");
const Parser = require("../src/parser/parser");

test("parses variable declaration", () => {
    const lexer = new Lexer("age := 22");
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert.strictEqual(ast.type, "Program");
    assert.strictEqual(ast.body.length, 1);

    assert.strictEqual(
        ast.body[0].type,
        "VariableDeclaration"
    );

    assert.strictEqual(
        ast.body[0].name,
        "age"
    );

    assert.strictEqual(
        ast.body[0].value.type,
        "NumberLiteral"
    );

    assert.strictEqual(
        ast.body[0].value.value,
        22
    );
});
test("parses arithmetic expression", () => {
    const lexer = new Lexer("result := 10 + 5 * 2");
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const expression = ast.body[0].value;

    assert.strictEqual(
        expression.type,
        "BinaryExpression"
    );

    assert.strictEqual(
        expression.operator,
        "+"
    );

    assert.strictEqual(
        expression.right.operator,
        "*"
    );
}); 
test("parses parentheses with arithmetic precedence", () => {
    const lexer = new Lexer(
        "result := (10 + 5) * 2"
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const expression = ast.body[0].value;

    assert.strictEqual(
        expression.type,
        "BinaryExpression"
    );

    assert.strictEqual(
        expression.operator,
        "*"
    );

    assert.strictEqual(
        expression.left.operator,
        "+"
    );
});
test("parses variable update", () => {
    const lexer = new Lexer(
        "age := 22\nage <- 25"
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert.strictEqual(ast.body.length, 2);

    assert.strictEqual(
        ast.body[0].type,
        "VariableDeclaration"
    );

    assert.strictEqual(
        ast.body[1].type,
        "VariableUpdate"
    );

    assert.strictEqual(
        ast.body[1].name,
        "age"
    );

    assert.strictEqual(
        ast.body[1].value.type,
        "NumberLiteral"
    );

    assert.strictEqual(
        ast.body[1].value.value,
        25
    );
});
test("parses show statement", () => {
    const lexer = new Lexer('show "Hello"');
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert.strictEqual(
        ast.body[0].type,
        "ShowStatement"
    );

    assert.strictEqual(
        ast.body[0].value.type,
        "TextLiteral"
    );

    assert.strictEqual(
        ast.body[0].value.value,
        "Hello"
    );
});
test("parses show variable", () => {
    const lexer = new Lexer(
        "age := 22\nshow age"
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    assert.strictEqual(ast.body.length, 2);

    assert.strictEqual(
        ast.body[0].type,
        "VariableDeclaration"
    );

    assert.strictEqual(
        ast.body[1].type,
        "ShowStatement"
    );

    assert.strictEqual(
        ast.body[1].value.type,
        "VariableReference"
    );

    assert.strictEqual(
        ast.body[1].value.name,
        "age"
    );
});
test("parses comparison expression", () => {
    const lexer = new Lexer(
        "age := 22\nshow age > 18"
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const comparison = ast.body[1].value;

    assert.strictEqual(
        comparison.type,
        "BinaryExpression"
    );

    assert.strictEqual(
        comparison.operator,
        ">"
    );

    assert.strictEqual(
        comparison.left.type,
        "VariableReference"
    );

    assert.strictEqual(
        comparison.left.name,
        "age"
    );

    assert.strictEqual(
        comparison.right.type,
        "NumberLiteral"
    );

    assert.strictEqual(
        comparison.right.value,
        18
    );
});
test("parses logical expression", () => {
    const lexer = new Lexer(
        "age := 22\nshow age > 18 and age < 60"
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const logical = ast.body[1].value;

    assert.strictEqual(
        logical.type,
        "LogicalExpression"
    );

    assert.strictEqual(
        logical.operator,
        "and"
    );

    assert.strictEqual(
        logical.left.type,
        "BinaryExpression"
    );

    assert.strictEqual(
        logical.right.type,
        "BinaryExpression"
    );
});
test("parses if statement", () => {
    const lexer = new Lexer(
        'age := 22\nif age > 18:\n    show "Adult"\n    show "Allowed"'
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const ifStatement = ast.body[1];

    assert.strictEqual(
        ifStatement.type,
        "IfStatement"
    );

    assert.strictEqual(
        ifStatement.condition.type,
        "BinaryExpression"
    );

    assert.strictEqual(
        ifStatement.condition.operator,
        ">"
    );

    assert.strictEqual(
        ifStatement.body.length,
        2
    );

    assert.strictEqual(
        ifStatement.body[0].type,
        "ShowStatement"
    );

    assert.strictEqual(
        ifStatement.body[1].type,
        "ShowStatement"
    );
});
test("parses if else statement", () => {
    const lexer = new Lexer(
        'age := 15\nif age > 18:\n    show "Adult"\nelse:\n    show "Not Adult"'
    );

    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const ifStatement = ast.body[1];

    assert.strictEqual(
        ifStatement.type,
        "IfStatement"
    );

    assert.strictEqual(
        ifStatement.body.length,
        1
    );

    assert.strictEqual(
        ifStatement.body[0].type,
        "ShowStatement"
    );

    assert.strictEqual(
        ifStatement.elseBody.length,
        1
    );

    assert.strictEqual(
        ifStatement.elseBody[0].type,
        "ShowStatement"
    );
});