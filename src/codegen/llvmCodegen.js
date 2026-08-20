const { Types } = require("../semantic/types");

function escapeLLVMString(str) {
    let escaped = "";
    let byteLength = 0;
    const utf8Bytes = Buffer.from(str, "utf8");

    for (let i = 0; i < utf8Bytes.length; i++) {
        const byte = utf8Bytes[i];
        if (byte === 34) {
            escaped += "\\22";
            byteLength++;
        } else if (byte === 92) {
            escaped += "\\5C";
            byteLength++;
        } else if (byte >= 32 && byte <= 126) {
            escaped += String.fromCharCode(byte);
            byteLength++;
        } else {
            const hex = byte.toString(16).toUpperCase().padStart(2, "0");
            escaped += `\\${hex}`;
            byteLength++;
        }
    }

    escaped += "\\00";
    byteLength += 1;
    return { escaped, byteLength };
}

class LLVMCodegen {
    constructor(ast) {
        this.ast = ast;
        this.globalConstants = [];
        this.stringMap = new Map();
        this.tempCounter = 0;
        this.labelCounter = 0;
        this.instructions = [];
        this.varCounter = 0;
        this.scopeStack = [];
    }

    nextTemp() {
        return `%t.${++this.tempCounter}`;
    }

    nextLabel(prefix = "lbl") {
        return `${prefix}.${++this.labelCounter}`;
    }

    getLLVMType(type) {
        switch (type) {
            case Types.NUMBER:
                return "double";
            case Types.BOOLEAN:
                return "i1";
            case Types.TEXT:
            case Types.NOTHING:
            default:
                return "i8*";
        }
    }

    pushScope() {
        this.scopeStack.push(new Map());
    }

    popScope() {
        this.scopeStack.pop();
    }

    declareVar(name, type) {
        const llvmType = this.getLLVMType(type);
        const varId = `%var.${name}.${++this.varCounter}`;
        const currentScope = this.scopeStack[this.scopeStack.length - 1];
        currentScope.set(name, { varId, type, llvmType });
        this.emit(`${varId} = alloca ${llvmType}`);
        return { varId, type, llvmType };
    }

    lookupVar(name) {
        for (let i = this.scopeStack.length - 1; i >= 0; i--) {
            if (this.scopeStack[i].has(name)) {
                return this.scopeStack[i].get(name);
            }
        }
        return null;
    }

    emit(instruction) {
        this.instructions.push(`  ${instruction}`);
    }

    emitLabel(label) {
        this.instructions.push(`${label}:`);
    }

    addStringConstant(str) {
        if (this.stringMap.has(str)) {
            return this.stringMap.get(str);
        }
        const index = this.globalConstants.length;
        const name = `@.str.${index}`;
        const { escaped, byteLength } = escapeLLVMString(str);
        this.globalConstants.push({ name, escaped, byteLength });
        const info = { name, byteLength };
        this.stringMap.set(str, info);
        return info;
    }

    generate() {
        this.globalConstants = [];
        this.stringMap = new Map();
        this.tempCounter = 0;
        this.labelCounter = 0;
        this.instructions = [];
        this.varCounter = 0;
        this.scopeStack = [];

        this.pushScope();

        for (const stmt of this.ast.body) {
            this.generateStatement(stmt);
        }

        this.emit("ret i32 0");
        this.popScope();

        return this.buildModule();
    }

    generateStatement(stmt) {
        switch (stmt.type) {
            case "VariableDeclaration": {
                const varInfo = this.declareVar(stmt.name, stmt.inferredType);
                const valTemp = this.generateExpression(stmt.value);
                this.emit(`store ${varInfo.llvmType} ${valTemp}, ${varInfo.llvmType}* ${varInfo.varId}`);
                break;
            }

            case "VariableUpdate": {
                const varInfo = this.lookupVar(stmt.name);
                const valTemp = this.generateExpression(stmt.value);
                this.emit(`store ${varInfo.llvmType} ${valTemp}, ${varInfo.llvmType}* ${varInfo.varId}`);
                break;
            }

            case "ShowStatement": {
                const valTemp = this.generateExpression(stmt.value);
                const type = stmt.value.inferredType;
                if (type === Types.NUMBER) {
                    this.emit(`call void @noor_print_num(double ${valTemp})`);
                } else if (type === Types.TEXT) {
                    this.emit(`call void @noor_print_str(i8* ${valTemp})`);
                } else if (type === Types.BOOLEAN) {
                    this.emit(`call void @noor_print_bool(i1 ${valTemp})`);
                } else if (type === Types.NOTHING) {
                    this.emit(`call void @noor_print_nothing()`);
                }
                break;
            }

            case "IfStatement": {
                const condTemp = this.generateExpression(stmt.condition);
                const thenLbl = this.nextLabel("if.then");
                const elseLbl = stmt.elseBody ? this.nextLabel("if.else") : null;
                const mergeLbl = this.nextLabel("if.merge");

                if (elseLbl) {
                    this.emit(`br i1 ${condTemp}, label %${thenLbl}, label %${elseLbl}`);
                } else {
                    this.emit(`br i1 ${condTemp}, label %${thenLbl}, label %${mergeLbl}`);
                }

                this.emitLabel(thenLbl);
                this.pushScope();
                for (const bodyStmt of stmt.body) {
                    this.generateStatement(bodyStmt);
                }
                this.popScope();
                this.emit(`br label %${mergeLbl}`);

                if (elseLbl) {
                    this.emitLabel(elseLbl);
                    this.pushScope();
                    for (const elseStmt of stmt.elseBody) {
                        this.generateStatement(elseStmt);
                    }
                    this.popScope();
                    this.emit(`br label %${mergeLbl}`);
                }

                this.emitLabel(mergeLbl);
                break;
            }
        }
    }

    generateExpression(expr) {
        switch (expr.type) {
            case "NumberLiteral": {
                const temp = this.nextTemp();
                let numStr = Number(expr.value).toString();
                if (!numStr.includes(".")) {
                    numStr += ".0";
                }
                this.emit(`${temp} = fadd double ${numStr}, 0.0`);
                return temp;
            }

            case "TextLiteral": {
                const { name, byteLength } = this.addStringConstant(expr.value);
                const temp = this.nextTemp();
                this.emit(
                    `${temp} = getelementptr inbounds [${byteLength} x i8], [${byteLength} x i8]* ${name}, i32 0, i32 0`
                );
                return temp;
            }

            case "BooleanLiteral": {
                const temp = this.nextTemp();
                const boolVal = expr.value ? 1 : 0;
                this.emit(`${temp} = xor i1 ${boolVal}, 0`);
                return temp;
            }

            case "NothingLiteral": {
                const temp = this.nextTemp();
                this.emit(`${temp} = inttoptr i64 0 to i8*`);
                return temp;
            }

            case "VariableReference": {
                const varInfo = this.lookupVar(expr.name);
                const temp = this.nextTemp();
                this.emit(`${temp} = load ${varInfo.llvmType}, ${varInfo.llvmType}* ${varInfo.varId}`);
                return temp;
            }

            case "UnaryExpression": {
                const opTemp = this.generateExpression(expr.operand);
                const temp = this.nextTemp();
                if (expr.operator === "not") {
                    this.emit(`${temp} = xor i1 ${opTemp}, 1`);
                    return temp;
                } else if (expr.operator === "-") {
                    this.emit(`${temp} = fsub double 0.0, ${opTemp}`);
                    return temp;
                }
                break;
            }

            case "BinaryExpression": {
                const leftTemp = this.generateExpression(expr.left);
                const rightTemp = this.generateExpression(expr.right);
                const temp = this.nextTemp();

                if (expr.operator === "+") {
                    this.emit(`${temp} = fadd double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "-") {
                    this.emit(`${temp} = fsub double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "*") {
                    this.emit(`${temp} = fmul double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "/") {
                    this.emit(`${temp} = fdiv double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "%") {
                    this.emit(`${temp} = call double @fmod(double ${leftTemp}, double ${rightTemp})`);
                    return temp;
                } else if (expr.operator === ">") {
                    this.emit(`${temp} = fcmp ogt double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "<") {
                    this.emit(`${temp} = fcmp olt double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === ">=") {
                    this.emit(`${temp} = fcmp oge double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "<=") {
                    this.emit(`${temp} = fcmp ole double ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "==") {
                    if (expr.left.inferredType === Types.NUMBER) {
                        this.emit(`${temp} = fcmp oeq double ${leftTemp}, ${rightTemp}`);
                    } else if (expr.left.inferredType === Types.BOOLEAN) {
                        this.emit(`${temp} = icmp eq i1 ${leftTemp}, ${rightTemp}`);
                    } else if (expr.left.inferredType === Types.TEXT) {
                        const cmpTemp = this.nextTemp();
                        this.emit(`${cmpTemp} = call i32 @strcmp(i8* ${leftTemp}, i8* ${rightTemp})`);
                        this.emit(`${temp} = icmp eq i32 ${cmpTemp}, 0`);
                    } else {
                        this.emit(`${temp} = icmp eq i8* ${leftTemp}, ${rightTemp}`);
                    }
                    return temp;
                } else if (expr.operator === "!=") {
                    if (expr.left.inferredType === Types.NUMBER) {
                        this.emit(`${temp} = fcmp one double ${leftTemp}, ${rightTemp}`);
                    } else if (expr.left.inferredType === Types.BOOLEAN) {
                        this.emit(`${temp} = icmp ne i1 ${leftTemp}, ${rightTemp}`);
                    } else if (expr.left.inferredType === Types.TEXT) {
                        const cmpTemp = this.nextTemp();
                        this.emit(`${cmpTemp} = call i32 @strcmp(i8* ${leftTemp}, i8* ${rightTemp})`);
                        this.emit(`${temp} = icmp ne i32 ${cmpTemp}, 0`);
                    } else {
                        this.emit(`${temp} = icmp ne i8* ${leftTemp}, ${rightTemp}`);
                    }
                    return temp;
                }
                break;
            }

            case "LogicalExpression": {
                const leftTemp = this.generateExpression(expr.left);
                const rightTemp = this.generateExpression(expr.right);
                const temp = this.nextTemp();

                if (expr.operator === "and") {
                    this.emit(`${temp} = and i1 ${leftTemp}, ${rightTemp}`);
                    return temp;
                } else if (expr.operator === "or") {
                    this.emit(`${temp} = or i1 ${leftTemp}, ${rightTemp}`);
                    return temp;
                }
                break;
            }
        }
    }

    buildModule() {
        const lines = [];

        lines.push("@fmt_int = private unnamed_addr constant [6 x i8] c\"%lld\\0A\\00\", align 1");
        lines.push("@fmt_float = private unnamed_addr constant [4 x i8] c\"%g\\0A\\00\", align 1");
        lines.push("@fmt_str = private unnamed_addr constant [4 x i8] c\"%s\\0A\\00\", align 1");
        lines.push("@str_yes = private unnamed_addr constant [5 x i8] c\"yes\\0A\\00\", align 1");
        lines.push("@str_no = private unnamed_addr constant [4 x i8] c\"no\\0A\\00\", align 1");
        lines.push("@str_nothing = private unnamed_addr constant [9 x i8] c\"nothing\\0A\\00\", align 1");

        for (const gc of this.globalConstants) {
            lines.push(
                `${gc.name} = private unnamed_addr constant [${gc.byteLength} x i8] c"${gc.escaped}", align 1`
            );
        }

        lines.push("");
        lines.push("declare i32 @printf(i8*, ...)");
        lines.push("declare double @floor(double)");
        lines.push("declare double @fmod(double, double)");
        lines.push("declare i32 @strcmp(i8*, i8*)");
        lines.push("");

        lines.push("define void @noor_print_str(i8* %s) {");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @fmt_str, i32 0, i32 0), i8* %s)");
        lines.push("  ret void");
        lines.push("}");
        lines.push("");

        lines.push("define void @noor_print_bool(i1 %b) {");
        lines.push("  br i1 %b, label %is_yes, label %is_no");
        lines.push("is_yes:");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @str_yes, i32 0, i32 0))");
        lines.push("  ret void");
        lines.push("is_no:");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @str_no, i32 0, i32 0))");
        lines.push("  ret void");
        lines.push("}");
        lines.push("");

        lines.push("define void @noor_print_nothing() {");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @str_nothing, i32 0, i32 0))");
        lines.push("  ret void");
        lines.push("}");
        lines.push("");

        lines.push("define void @noor_print_num(double %val) {");
        lines.push("  %fl = call double @floor(double %val)");
        lines.push("  %is_int = fcmp oeq double %fl, %val");
        lines.push("  br i1 %is_int, label %print_as_int, label %print_as_float");
        lines.push("print_as_int:");
        lines.push("  %ival = fptosi double %val to i64");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @fmt_int, i32 0, i32 0), i64 %ival)");
        lines.push("  ret void");
        lines.push("print_as_float:");
        lines.push("  call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @fmt_float, i32 0, i32 0), double %val)");
        lines.push("  ret void");
        lines.push("}");
        lines.push("");

        lines.push("define i32 @main(i32 %argc, i8** %argv) {");
        lines.push(...this.instructions);
        lines.push("}");

        return lines.join("\n");
    }
}

module.exports = LLVMCodegen;
