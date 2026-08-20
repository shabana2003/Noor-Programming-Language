const Token = require("./token");
const TokenType = require("./TokenType");
const keywords = require("./keywords");

class Lexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.tokens = [];
        this.line = 1;
        this.indentStack = [0];
        this.atLineStart = true;
    }

    tokenize() {
        while (!this.isAtEnd()) {
            this.scanToken();
        }

        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.tokens.push(new Token(TokenType.DEDENT, null, this.line));
        }

        this.tokens.push(new Token(TokenType.EOF, null, this.line));
        return this.tokens;
    }

    scanToken() {
        if (this.atLineStart) {
            this.handleIndentation();
            this.atLineStart = false;

            if (this.isAtEnd()) {
                return;
            }
        }

        const char = this.advance();

        if (char === "#") {
            this.skipComment();
            return;
        }

        if (char === "\n") {
            this.tokens.push(new Token(TokenType.NEWLINE, "\n", this.line));
            this.line++;
            this.atLineStart = true;
            return;
        }

        if (this.isWhitespace(char)) {
            return;
        }

        if (this.isDigit(char)) {
            this.readNumber();
            return;
        }

        if (this.isLetter(char)) {
            this.readIdentifier();
            return;
        }

        if (char === '"') {
            this.readString();
            return;
        }

        if (char === ":") {
            if (this.match("=")) {
                this.tokens.push(new Token(TokenType.CREATE, ":=", this.line));
                return;
            }
            this.tokens.push(new Token(TokenType.COLON, ":", this.line));
            return;
        }

        if (char === "<") {
            if (this.match("-")) {
                this.tokens.push(new Token(TokenType.UPDATE, "<-", this.line));
                return;
            }
            if (this.match("=")) {
                this.tokens.push(new Token(TokenType.LESS_EQUAL, "<=", this.line));
                return;
            }
            this.tokens.push(new Token(TokenType.LESS, "<", this.line));
            return;
        }

        if (char === ">") {
            if (this.match("=")) {
                this.tokens.push(new Token(TokenType.GREATER_EQUAL, ">=", this.line));
                return;
            }
            this.tokens.push(new Token(TokenType.GREATER, ">", this.line));
            return;
        }

        if (char === "=") {
            if (this.match("=")) {
                this.tokens.push(new Token(TokenType.EQUAL, "==", this.line));
                return;
            }
            throw new Error(`Unexpected character '=' at line ${this.line}`);
        }

        if (char === "!") {
            if (this.match("=")) {
                this.tokens.push(new Token(TokenType.NOT_EQUAL, "!=", this.line));
                return;
            }
            throw new Error(`Unexpected character '!' at line ${this.line}`);
        }

        if (char === "+") {
            this.tokens.push(new Token(TokenType.PLUS, "+", this.line));
            return;
        }

        if (char === "-") {
            this.tokens.push(new Token(TokenType.MINUS, "-", this.line));
            return;
        }

        if (char === "*") {
            this.tokens.push(new Token(TokenType.MULTIPLY, "*", this.line));
            return;
        }

        if (char === "/") {
            this.tokens.push(new Token(TokenType.DIVIDE, "/", this.line));
            return;
        }

        if (char === "%") {
            this.tokens.push(new Token(TokenType.MODULO, "%", this.line));
            return;
        }

        if (char === "(") {
            this.tokens.push(new Token(TokenType.LEFT_PAREN, "(", this.line));
            return;
        }

        if (char === ")") {
            this.tokens.push(new Token(TokenType.RIGHT_PAREN, ")", this.line));
            return;
        }

        if (char === "[") {
            this.tokens.push(new Token(TokenType.LEFT_BRACKET, "[", this.line));
            return;
        }

        if (char === "]") {
            this.tokens.push(new Token(TokenType.RIGHT_BRACKET, "]", this.line));
            return;
        }

        if (char === ",") {
            this.tokens.push(new Token(TokenType.COMMA, ",", this.line));
            return;
        }

        throw new Error(`Unexpected character '${char}' at line ${this.line}`);
    }

    advance() {
        const char = this.source[this.position];
        this.position++;
        return char;
    }

    match(expected) {
        if (this.isAtEnd() || this.source[this.position] !== expected) {
            return false;
        }
        this.position++;
        return true;
    }

    isAtEnd() {
        return this.position >= this.source.length;
    }

    isWhitespace(char) {
        return char === " " || char === "\t" || char === "\r";
    }

    skipComment() {
        while (!this.isAtEnd() && this.source[this.position] !== "\n") {
            this.position++;
        }
    }

    isDigit(char) {
        return char >= "0" && char <= "9";
    }

    isLetter(char) {
        return (
            (char >= "a" && char <= "z") ||
            (char >= "A" && char <= "Z") ||
            char === "_"
        );
    }

    handleIndentation() {
        let spaces = 0;
        while (!this.isAtEnd() && this.source[this.position] === " ") {
            spaces++;
            this.position++;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (spaces > currentIndent) {
            this.indentStack.push(spaces);
            this.tokens.push(new Token(TokenType.INDENT, spaces, this.line));
            return;
        }

        if (spaces < currentIndent) {
            while (
                this.indentStack.length > 1 &&
                spaces < this.indentStack[this.indentStack.length - 1]
            ) {
                this.indentStack.pop();
                this.tokens.push(new Token(TokenType.DEDENT, null, this.line));
            }

            const newIndent = this.indentStack[this.indentStack.length - 1];
            if (spaces !== newIndent) {
                throw new Error(`Invalid indentation at line ${this.line}`);
            }
        }
    }

    readNumber() {
        const start = this.position - 1;
        while (!this.isAtEnd() && this.isDigit(this.source[this.position])) {
            this.position++;
        }

        const value = this.source.slice(start, this.position);
        this.tokens.push(new Token(TokenType.NUMBER, Number(value), this.line));
    }

    readString() {
        const start = this.position;
        while (!this.isAtEnd() && this.source[this.position] !== '"') {
            this.position++;
        }

        if (this.isAtEnd()) {
            throw new Error(`Unterminated string at line ${this.line}`);
        }

        const value = this.source.slice(start, this.position);
        this.position++; // consume closing quote

        this.tokens.push(new Token(TokenType.TEXT, value, this.line));
    }

    readIdentifier() {
        const start = this.position - 1;
        while (!this.isAtEnd() && this.isLetterOrDigit(this.source[this.position])) {
            this.position++;
        }

        const value = this.source.slice(start, this.position);
        const type = keywords[value] || TokenType.IDENTIFIER;

        this.tokens.push(new Token(type, value, this.line));
    }

    isLetterOrDigit(char) {
        return this.isLetter(char) || this.isDigit(char);
    }
}

module.exports = Lexer;