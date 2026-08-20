const test = require("node:test");
const assert = require("node:assert");

const Lexer = require("../src/lexer/Lexer");
const TokenType = require("../src/lexer/TokenType");

test("lexes identifier", () => {
    const lexer = new Lexer("age");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[0].value, "age");
});

test("lexes number", () => {
    const lexer = new Lexer("22");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.NUMBER);
    assert.strictEqual(tokens[0].value, 22);
});
test("lexes create operator", () => {
    const lexer = new Lexer("age := 22");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[0].value, "age");

    assert.strictEqual(tokens[1].type, TokenType.CREATE);
    assert.strictEqual(tokens[1].value, ":=");

    assert.strictEqual(tokens[2].type, TokenType.NUMBER);
    assert.strictEqual(tokens[2].value, 22);
});

test("lexes update operator", () => {
    const lexer = new Lexer("age <- 25");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[0].value, "age");

    assert.strictEqual(tokens[1].type, TokenType.UPDATE);
    assert.strictEqual(tokens[1].value, "<-");

    assert.strictEqual(tokens[2].type, TokenType.NUMBER);
    assert.strictEqual(tokens[2].value, 25);
});
test("lexes arithmetic operators", () => {
    const lexer = new Lexer("+ - * / %");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.PLUS);
    assert.strictEqual(tokens[0].value, "+");

    assert.strictEqual(tokens[1].type, TokenType.MINUS);
    assert.strictEqual(tokens[1].value, "-");

    assert.strictEqual(tokens[2].type, TokenType.MULTIPLY);
    assert.strictEqual(tokens[2].value, "*");

    assert.strictEqual(tokens[3].type, TokenType.DIVIDE);
    assert.strictEqual(tokens[3].value, "/");

    assert.strictEqual(tokens[4].type, TokenType.MODULO);
    assert.strictEqual(tokens[4].value, "%");
});
test("lexes comparison operators", () => {
    const lexer = new Lexer("> < >= <= == !=");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.GREATER);
    assert.strictEqual(tokens[0].value, ">");

    assert.strictEqual(tokens[1].type, TokenType.LESS);
    assert.strictEqual(tokens[1].value, "<");

    assert.strictEqual(tokens[2].type, TokenType.GREATER_EQUAL);
    assert.strictEqual(tokens[2].value, ">=");

    assert.strictEqual(tokens[3].type, TokenType.LESS_EQUAL);
    assert.strictEqual(tokens[3].value, "<=");

    assert.strictEqual(tokens[4].type, TokenType.EQUAL);
    assert.strictEqual(tokens[4].value, "==");

    assert.strictEqual(tokens[5].type, TokenType.NOT_EQUAL);
    assert.strictEqual(tokens[5].value, "!=");
});
test("lexes keywords", () => {
    const lexer = new Lexer(
        "show ask yes no nothing and or not"
    );

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.SHOW);
    assert.strictEqual(tokens[1].type, TokenType.ASK);
    assert.strictEqual(tokens[2].type, TokenType.YES);
    assert.strictEqual(tokens[3].type, TokenType.NO);
    assert.strictEqual(tokens[4].type, TokenType.NOTHING);
    assert.strictEqual(tokens[5].type, TokenType.AND);
    assert.strictEqual(tokens[6].type, TokenType.OR);
    assert.strictEqual(tokens[7].type, TokenType.NOT);
});
test("lexes punctuation", () => {
    const lexer = new Lexer("( ) [ ] , :");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.LEFT_PAREN);
    assert.strictEqual(tokens[1].type, TokenType.RIGHT_PAREN);

    assert.strictEqual(tokens[2].type, TokenType.LEFT_BRACKET);
    assert.strictEqual(tokens[3].type, TokenType.RIGHT_BRACKET);

    assert.strictEqual(tokens[4].type, TokenType.COMMA);
    assert.strictEqual(tokens[5].type, TokenType.COLON);
});
test("lexes text", () => {
    const lexer = new Lexer('"Hello Noor"');

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.TEXT);
    assert.strictEqual(tokens[0].value, "Hello Noor");
});
test("lexes variable with text", () => {
    const lexer = new Lexer('name := "Shabana"');

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[0].value, "name");

    assert.strictEqual(tokens[1].type, TokenType.CREATE);
    assert.strictEqual(tokens[1].value, ":=");

    assert.strictEqual(tokens[2].type, TokenType.TEXT);
    assert.strictEqual(tokens[2].value, "Shabana");
});
test("lexes boolean and nothing", () => {
    const lexer = new Lexer("yes no nothing");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.YES);
    assert.strictEqual(tokens[1].type, TokenType.NO);
    assert.strictEqual(tokens[2].type, TokenType.NOTHING);
});
test("lexes newline", () => {
    const lexer = new Lexer("age := 22\nname := 25");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].type, TokenType.CREATE);
    assert.strictEqual(tokens[2].type, TokenType.NUMBER);

    assert.strictEqual(tokens[3].type, TokenType.NEWLINE);

    assert.strictEqual(tokens[4].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[5].type, TokenType.CREATE);
    assert.strictEqual(tokens[6].type, TokenType.NUMBER);
});
test("tracks line numbers", () => {
    const lexer = new Lexer("age := 22\nname := 25");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].line, 1);
    assert.strictEqual(tokens[1].line, 1);
    assert.strictEqual(tokens[2].line, 1);

    assert.strictEqual(tokens[4].line, 2);
    assert.strictEqual(tokens[5].line, 2);
    assert.strictEqual(tokens[6].line, 2);
});
test("lexes if and else keywords", () => {
    const lexer = new Lexer("if else");

    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.IF);
    assert.strictEqual(tokens[1].type, TokenType.ELSE);
});
test("lexes indentation", () => {
    const lexer = new Lexer(
        'if age > 18:\n    show "Adult"\n    show "Allowed"\nshow "Done"'
    );

    const tokens = lexer.tokenize();

    const types = tokens.map(token => token.type);

    assert.deepStrictEqual(types, [
        TokenType.IF,
        TokenType.IDENTIFIER,
        TokenType.GREATER,
        TokenType.NUMBER,
        TokenType.COLON,
        TokenType.NEWLINE,

        TokenType.INDENT,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.NEWLINE,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.NEWLINE,

        TokenType.DEDENT,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.EOF
    ]);
});
test("lexes nested indentation", () => {
    const lexer = new Lexer(
        'if age > 18:\n    if age > 21:\n        show "Adult"\n    show "Allowed"\nshow "Done"'
    );

    const tokens = lexer.tokenize();

    const types = tokens.map(token => token.type);

    assert.deepStrictEqual(types, [
        TokenType.IF,
        TokenType.IDENTIFIER,
        TokenType.GREATER,
        TokenType.NUMBER,
        TokenType.COLON,
        TokenType.NEWLINE,

        TokenType.INDENT,

        TokenType.IF,
        TokenType.IDENTIFIER,
        TokenType.GREATER,
        TokenType.NUMBER,
        TokenType.COLON,
        TokenType.NEWLINE,

        TokenType.INDENT,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.NEWLINE,

        TokenType.DEDENT,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.NEWLINE,

        TokenType.DEDENT,

        TokenType.SHOW,
        TokenType.TEXT,
        TokenType.EOF
    ]);
});
test("rejects invalid indentation", () => {
    const lexer = new Lexer(
        'if age > 18:\n    show "Adult"\n  show "Allowed"'
    );

    assert.throws(
        () => lexer.tokenize(),
        /Invalid indentation/
    );
});
test("ignores comments", () => {
    const lexer = new Lexer(
        '# this is a comment\nage := 22'
    );

    const tokens = lexer.tokenize();

    const types = tokens.map(token => token.type);

    assert.deepStrictEqual(types, [
        TokenType.NEWLINE,
        TokenType.IDENTIFIER,
        TokenType.CREATE,
        TokenType.NUMBER,
        TokenType.EOF
    ]);
});
test("ignores inline comments", () => {
    const lexer = new Lexer(
        'age := 22 # age value\nshow age'
    );

    const tokens = lexer.tokenize();

    const types = tokens.map(token => token.type);

    assert.deepStrictEqual(types, [
        TokenType.IDENTIFIER,
        TokenType.CREATE,
        TokenType.NUMBER,
        TokenType.NEWLINE,
        TokenType.SHOW,
        TokenType.IDENTIFIER,
        TokenType.EOF
    ]);
});