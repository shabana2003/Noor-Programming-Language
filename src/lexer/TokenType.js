const TokenType = {
    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    TEXT: "TEXT",

    CREATE: "CREATE",
    UPDATE: "UPDATE",

    SHOW: "SHOW",
    ASK: "ASK",

    IF: "IF",
    ELSE: "ELSE",

    YES: "YES",
    NO: "NO",
    NOTHING: "NOTHING",

    PLUS: "PLUS",
    MINUS: "MINUS",
    MULTIPLY: "MULTIPLY",
    DIVIDE: "DIVIDE",
    MODULO: "MODULO",

    GREATER: "GREATER",
    LESS: "LESS",
    GREATER_EQUAL: "GREATER_EQUAL",
    LESS_EQUAL: "LESS_EQUAL",
    EQUAL: "EQUAL",
    NOT_EQUAL: "NOT_EQUAL",

    AND: "AND",
    OR: "OR",
    NOT: "NOT",

    LEFT_PAREN: "LEFT_PAREN",
    RIGHT_PAREN: "RIGHT_PAREN",

    LEFT_BRACKET: "LEFT_BRACKET",
    RIGHT_BRACKET: "RIGHT_BRACKET",

    COMMA: "COMMA",
    COLON: "COLON",

    NEWLINE: "NEWLINE",
    INDENT: "INDENT",
    DEDENT: "DEDENT",

    EOF: "EOF"
};

module.exports = TokenType;