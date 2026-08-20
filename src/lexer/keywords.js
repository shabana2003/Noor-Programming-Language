const TokenType = require("./TokenType");

const keywords = {
    show: TokenType.SHOW,
    ask: TokenType.ASK,

    if: TokenType.IF,
    else: TokenType.ELSE,


    yes: TokenType.YES,
    no: TokenType.NO,
    nothing: TokenType.NOTHING,

    and: TokenType.AND,
    or: TokenType.OR,
    not: TokenType.NOT
};

module.exports = keywords;