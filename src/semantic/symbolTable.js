class SymbolTable {
    constructor(parent = null) {
        this.parent = parent;
        this.symbols = new Map();
    }

    define(name, type, line = null) {
        if (this.symbols.has(name)) {
            const existing = this.symbols.get(name);
            const lineInfo = line ? ` at line ${line}` : "";
            const prevInfo = existing.line ? ` (previously declared at line ${existing.line})` : "";
            throw new Error(`Variable '${name}' is already declared in this scope${lineInfo}${prevInfo}.`);
        }

        const symbol = { name, type, line };
        this.symbols.set(name, symbol);
        return symbol;
    }

    lookup(name) {
        if (this.symbols.has(name)) {
            return this.symbols.get(name);
        }

        if (this.parent) {
            return this.parent.lookup(name);
        }

        return null;
    }

    update(name, type, line = null) {
        const symbol = this.lookup(name);
        const lineInfo = line ? ` at line ${line}` : "";

        if (!symbol) {
            throw new Error(`Undefined variable '${name}'${lineInfo}.`);
        }

        if (symbol.type !== type) {
            throw new Error(
                `Type mismatch: Cannot assign ${type} to variable '${name}' of type ${symbol.type}${lineInfo}.`
            );
        }

        return symbol;
    }
}

module.exports = SymbolTable;
