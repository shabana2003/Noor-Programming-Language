const TokenType = require("../lexer/TokenType");
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
} = require("../ast/ast");

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    parse() {
        const body = [];

        while (!this.isAtEnd()) {
            if (this.match(TokenType.NEWLINE)) {
                continue;
            }

            body.push(this.parseStatement());

            if (this.check(TokenType.NEWLINE)) {
                this.advance();
            }
        }

        return new Program(body, body[0]?.line || 1);
    }

    parseStatement() {
        if (this.check(TokenType.SHOW)) {
            return this.parseShowStatement();
        }

        if (this.check(TokenType.IF)) {
            return this.parseIfStatement();
        }

        if (this.check(TokenType.IDENTIFIER)) {
            if (this.tokens[this.position + 1]?.type === TokenType.UPDATE) {
                return this.parseUpdateStatement();
            }
            return this.parseVariableDeclaration();
        }

        const token = this.peek();
        throw new Error(
            `Unexpected token '${token.value ?? token.type}' at line ${token.line}`
        );
    }

    parseVariableDeclaration() {
        const nameToken = this.consume(
            TokenType.IDENTIFIER,
            "Expected variable name."
        );

        this.consume(TokenType.CREATE, "Expected ':=' after variable name.");
        const value = this.parseExpression();

        return new VariableDeclaration(nameToken.value, value, nameToken.line);
    }

    parseUpdateStatement() {
        const nameToken = this.consume(
            TokenType.IDENTIFIER,
            "Expected variable name."
        );

        this.consume(TokenType.UPDATE, "Expected '<-' after variable name.");
        const value = this.parseExpression();

        return new VariableUpdate(nameToken.value, value, nameToken.line);
    }

    parseShowStatement() {
        const showToken = this.consume(TokenType.SHOW, "Expected 'show'.");
        const value = this.parseExpression();
        return new ShowStatement(value, showToken.line);
    }

    parseIfStatement() {
        const ifToken = this.consume(TokenType.IF, "Expected 'if'.");
        const condition = this.parseExpression();

        this.consume(TokenType.COLON, "Expected ':' after if condition.");
        this.consume(TokenType.NEWLINE, "Expected new line after ':'.");
        this.consume(TokenType.INDENT, "Expected indented block after if.");

        const body = [];
        while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
            if (this.match(TokenType.NEWLINE)) {
                continue;
            }
            body.push(this.parseStatement());
            if (this.check(TokenType.NEWLINE)) {
                this.advance();
            }
        }
        this.consume(TokenType.DEDENT, "Expected end of if block.");

        let elseBody = null;
        if (this.match(TokenType.ELSE)) {
            this.consume(TokenType.COLON, "Expected ':' after else.");
            this.consume(TokenType.NEWLINE, "Expected new line after ':'.");
            this.consume(TokenType.INDENT, "Expected indented block after else.");

            elseBody = [];
            while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
                if (this.match(TokenType.NEWLINE)) {
                    continue;
                }
                elseBody.push(this.parseStatement());
                if (this.check(TokenType.NEWLINE)) {
                    this.advance();
                }
            }
            this.consume(TokenType.DEDENT, "Expected end of else block.");
        }

        return new IfStatement(condition, body, elseBody, ifToken.line);
    }

    parseExpression() {
        return this.parseOr();
    }

    parseOr() {
        let expression = this.parseAnd();

        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.parseAnd();
            expression = new LogicalExpression(
                operator.value,
                expression,
                right,
                operator.line
            );
        }

        return expression;
    }

    parseAnd() {
        let expression = this.parseComparison();

        while (this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.parseComparison();
            expression = new LogicalExpression(
                operator.value,
                expression,
                right,
                operator.line
            );
        }

        return expression;
    }

    parseComparison() {
        let expression = this.parseAddition();

        while (
            this.match(TokenType.GREATER) ||
            this.match(TokenType.LESS) ||
            this.match(TokenType.GREATER_EQUAL) ||
            this.match(TokenType.LESS_EQUAL) ||
            this.match(TokenType.EQUAL) ||
            this.match(TokenType.NOT_EQUAL)
        ) {
            const operator = this.previous();
            const right = this.parseAddition();
            expression = new BinaryExpression(
                operator.value,
                expression,
                right,
                operator.line
            );
        }

        return expression;
    }

    parseAddition() {
        let expression = this.parseMultiplication();

        while (this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.parseMultiplication();
            expression = new BinaryExpression(
                operator.value,
                expression,
                right,
                operator.line
            );
        }

        return expression;
    }

    parseMultiplication() {
        let expression = this.parseUnary();

        while (
            this.match(TokenType.MULTIPLY) ||
            this.match(TokenType.DIVIDE) ||
            this.match(TokenType.MODULO)
        ) {
            const operator = this.previous();
            const right = this.parseUnary();
            expression = new BinaryExpression(
                operator.value,
                expression,
                right,
                operator.line
            );
        }

        return expression;
    }

    parseUnary() {
        if (this.match(TokenType.NOT) || this.match(TokenType.MINUS)) {
            const operator = this.previous();
            const operand = this.parseUnary();
            return new UnaryExpression(operator.value, operand, operator.line);
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        if (this.match(TokenType.NUMBER)) {
            const token = this.previous();
            return new NumberLiteral(token.value, token.line);
        }

        if (this.match(TokenType.TEXT)) {
            const token = this.previous();
            return new TextLiteral(token.value, token.line);
        }

        if (this.match(TokenType.YES)) {
            const token = this.previous();
            return new BooleanLiteral(true, token.line);
        }

        if (this.match(TokenType.NO)) {
            const token = this.previous();
            return new BooleanLiteral(false, token.line);
        }

        if (this.match(TokenType.NOTHING)) {
            const token = this.previous();
            return new NothingLiteral(token.line);
        }

        if (this.match(TokenType.IDENTIFIER)) {
            const token = this.previous();
            return new VariableReference(token.value, token.line);
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expression = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
            return expression;
        }

        const token = this.peek();
        throw new Error(
            `Unexpected token '${token.value ?? token.type}' at line ${token.line}`
        );
    }

    match(type) {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }

        const token = this.peek();
        throw new Error(
            `${message} Found '${token.value ?? token.type}' at line ${token.line}`
        );
    }

    check(type) {
        if (this.isAtEnd()) {
            return type === TokenType.EOF;
        }
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) {
            this.position++;
        }
        return this.previous();
    }

    peek() {
        return this.tokens[this.position];
    }

    previous() {
        return this.tokens[this.position - 1];
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }
}

module.exports = Parser;