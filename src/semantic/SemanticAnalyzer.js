const { Types } = require("./types");
const SymbolTable = require("./symbolTable");

class SemanticError extends Error {
    constructor(message, line = null, filename = null) {
        let formatted = message;
        if (filename && line) {
            formatted = `${filename}:${line}: ${message}`;
        } else if (line) {
            formatted = `Line ${line}: ${message}`;
        }
        super(formatted);
        this.name = "SemanticError";
        this.rawMessage = message;
        this.line = line;
        this.filename = filename;
    }
}

class SemanticAnalyzer {
    constructor(ast, filename = null) {
        this.ast = ast;
        this.filename = filename;
        this.globalScope = new SymbolTable();
    }

    analyze() {
        if (!this.ast || this.ast.type !== "Program") {
            throw new SemanticError("Invalid AST: Expected Program node", 1, this.filename);
        }

        for (const statement of this.ast.body) {
            this.visitStatement(statement, this.globalScope);
        }

        return {
            ast: this.ast,
            globalScope: this.globalScope
        };
    }

    visitStatement(stmt, scope) {
        switch (stmt.type) {
            case "VariableDeclaration": {
                const valueType = this.visitExpression(stmt.value, scope);
                stmt.inferredType = valueType;
                try {
                    scope.define(stmt.name, valueType, stmt.line);
                } catch (err) {
                    throw new SemanticError(err.message, stmt.line, this.filename);
                }
                break;
            }

            case "VariableUpdate": {
                const symbol = scope.lookup(stmt.name);
                if (!symbol) {
                    throw new SemanticError(
                        `Undefined variable '${stmt.name}'`,
                        stmt.line,
                        this.filename
                    );
                }

                const valueType = this.visitExpression(stmt.value, scope);
                stmt.inferredType = valueType;

                if (symbol.type !== valueType) {
                    throw new SemanticError(
                        `Type mismatch: Cannot assign ${valueType} to variable '${stmt.name}' of type ${symbol.type}`,
                        stmt.line,
                        this.filename
                    );
                }
                break;
            }

            case "ShowStatement": {
                const valueType = this.visitExpression(stmt.value, scope);
                stmt.inferredType = valueType;
                break;
            }

            case "IfStatement": {
                const conditionType = this.visitExpression(stmt.condition, scope);
                if (conditionType !== Types.BOOLEAN) {
                    throw new SemanticError(
                        `If condition must evaluate to BOOLEAN, got ${conditionType}`,
                        stmt.line,
                        this.filename
                    );
                }

                const thenScope = new SymbolTable(scope);
                for (const bodyStmt of stmt.body) {
                    this.visitStatement(bodyStmt, thenScope);
                }

                if (stmt.elseBody) {
                    const elseScope = new SymbolTable(scope);
                    for (const elseStmt of stmt.elseBody) {
                        this.visitStatement(elseStmt, elseScope);
                    }
                }
                break;
            }

            default:
                throw new SemanticError(
                    `Unknown statement type: ${stmt.type}`,
                    stmt.line,
                    this.filename
                );
        }
    }

    visitExpression(expr, scope) {
        switch (expr.type) {
            case "NumberLiteral":
                expr.inferredType = Types.NUMBER;
                return Types.NUMBER;

            case "TextLiteral":
                expr.inferredType = Types.TEXT;
                return Types.TEXT;

            case "BooleanLiteral":
                expr.inferredType = Types.BOOLEAN;
                return Types.BOOLEAN;

            case "NothingLiteral":
                expr.inferredType = Types.NOTHING;
                return Types.NOTHING;

            case "VariableReference": {
                const symbol = scope.lookup(expr.name);
                if (!symbol) {
                    throw new SemanticError(
                        `Undefined variable '${expr.name}'`,
                        expr.line,
                        this.filename
                    );
                }
                expr.inferredType = symbol.type;
                return symbol.type;
            }

            case "UnaryExpression": {
                const operandType = this.visitExpression(expr.operand, scope);
                if (expr.operator === "not") {
                    if (operandType !== Types.BOOLEAN) {
                        throw new SemanticError(
                            `Operator 'not' expects BOOLEAN operand, got ${operandType}`,
                            expr.line,
                            this.filename
                        );
                    }
                    expr.inferredType = Types.BOOLEAN;
                    return Types.BOOLEAN;
                } else if (expr.operator === "-") {
                    if (operandType !== Types.NUMBER) {
                        throw new SemanticError(
                            `Unary operator '-' expects NUMBER operand, got ${operandType}`,
                            expr.line,
                            this.filename
                        );
                    }
                    expr.inferredType = Types.NUMBER;
                    return Types.NUMBER;
                }

                throw new SemanticError(
                    `Unsupported unary operator '${expr.operator}'`,
                    expr.line,
                    this.filename
                );
            }

            case "BinaryExpression": {
                const leftType = this.visitExpression(expr.left, scope);
                const rightType = this.visitExpression(expr.right, scope);

                const arithmeticOps = ["+", "-", "*", "/", "%"];
                const comparisonOps = [">", "<", ">=", "<="];
                const equalityOps = ["==", "!="];

                if (arithmeticOps.includes(expr.operator)) {
                    if (leftType !== Types.NUMBER || rightType !== Types.NUMBER) {
                        throw new SemanticError(
                            `Arithmetic operator '${expr.operator}' expects NUMBER operands, got ${leftType} and ${rightType}`,
                            expr.line,
                            this.filename
                        );
                    }
                    expr.inferredType = Types.NUMBER;
                    return Types.NUMBER;
                }

                if (comparisonOps.includes(expr.operator)) {
                    if (leftType !== Types.NUMBER || rightType !== Types.NUMBER) {
                        throw new SemanticError(
                            `Comparison operator '${expr.operator}' expects NUMBER operands, got ${leftType} and ${rightType}`,
                            expr.line,
                            this.filename
                        );
                    }
                    expr.inferredType = Types.BOOLEAN;
                    return Types.BOOLEAN;
                }

                if (equalityOps.includes(expr.operator)) {
                    if (leftType !== rightType) {
                        throw new SemanticError(
                            `Equality operator '${expr.operator}' cannot compare operands of different types (${leftType} and ${rightType})`,
                            expr.line,
                            this.filename
                        );
                    }
                    expr.inferredType = Types.BOOLEAN;
                    return Types.BOOLEAN;
                }

                throw new SemanticError(
                    `Unsupported binary operator '${expr.operator}'`,
                    expr.line,
                    this.filename
                );
            }

            case "LogicalExpression": {
                const leftType = this.visitExpression(expr.left, scope);
                const rightType = this.visitExpression(expr.right, scope);

                if (leftType !== Types.BOOLEAN || rightType !== Types.BOOLEAN) {
                    throw new SemanticError(
                        `Logical operator '${expr.operator}' expects BOOLEAN operands, got ${leftType} and ${rightType}`,
                        expr.line,
                        this.filename
                    );
                }

                expr.inferredType = Types.BOOLEAN;
                return Types.BOOLEAN;
            }

            default:
                throw new SemanticError(
                    `Unknown expression type: ${expr.type}`,
                    expr.line,
                    this.filename
                );
        }
    }
}

module.exports = {
    SemanticAnalyzer,
    SemanticError
};
