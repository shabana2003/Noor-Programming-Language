class Program {
    constructor(body, line = null) {
        this.type = "Program";
        this.body = body;
        this.line = line;
    }
}

class VariableDeclaration {
    constructor(name, value, line = null) {
        this.type = "VariableDeclaration";
        this.name = name;
        this.value = value;
        this.line = line;
    }
}

class VariableUpdate {
    constructor(name, value, line = null) {
        this.type = "VariableUpdate";
        this.name = name;
        this.value = value;
        this.line = line;
    }
}

class VariableReference {
    constructor(name, line = null) {
        this.type = "VariableReference";
        this.name = name;
        this.line = line;
    }
}

class NumberLiteral {
    constructor(value, line = null) {
        this.type = "NumberLiteral";
        this.value = value;
        this.line = line;
    }
}

class TextLiteral {
    constructor(value, line = null) {
        this.type = "TextLiteral";
        this.value = value;
        this.line = line;
    }
}

class BooleanLiteral {
    constructor(value, line = null) {
        this.type = "BooleanLiteral";
        this.value = value;
        this.line = line;
    }
}

class NothingLiteral {
    constructor(line = null) {
        this.type = "NothingLiteral";
        this.value = null;
        this.line = line;
    }
}

class UnaryExpression {
    constructor(operator, operand, line = null) {
        this.type = "UnaryExpression";
        this.operator = operator;
        this.operand = operand;
        this.line = line;
    }
}

class BinaryExpression {
    constructor(operator, left, right, line = null) {
        this.type = "BinaryExpression";
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.line = line;
    }
}

class LogicalExpression {
    constructor(operator, left, right, line = null) {
        this.type = "LogicalExpression";
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.line = line;
    }
}

class ShowStatement {
    constructor(value, line = null) {
        this.type = "ShowStatement";
        this.value = value;
        this.line = line;
    }
}

class IfStatement {
    constructor(condition, body, elseBody = null, line = null) {
        this.type = "IfStatement";
        this.condition = condition;
        this.body = body;
        this.elseBody = elseBody;
        this.line = line;
    }
}

module.exports = {
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
};