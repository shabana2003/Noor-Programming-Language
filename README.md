# Noor Programming Language

**Noor** is a native programming language built with an LLVM-based compiler backend. Noor source files use the `.noor` extension and are compiled into standalone native executable binaries with no JavaScript or Node.js dependencies at runtime.

---

## Compiler Architecture

```
Noor Source (.noor)
        ↓
      Lexer (Tokenization & Indentation Stack)
        ↓
      Tokens (IDENTIFIER, NUMBER, TEXT, CREATE, IF, ...)
        ↓
      Parser (AST Builder)
        ↓
       AST (Program, VariableDeclaration, IfStatement, ...)
        ↓
 Semantic Analyzer (Symbol Table, Scoping & Type Checker)
        ↓
  Native Code Generator (LLVM IR Generator)
        ↓
   LLVM IR (.ll)
        ↓
  Native Toolchain (Clang Assembler & Linker)
        ↓
  Native Standalone Executable Binary
```

---

## Language Syntax

### 1. Variables
- **Variable Creation** (`:=`): Declares and initializes a variable in the current scope.
- **Variable Update** (`<-`): Reassigns a value to an already-declared variable of the same type.

```noor
age := 22
show age

age <- 25
show age
```

### 2. Data Types
- **NUMBER**: 64-bit numbers supporting integers and floating point.
- **TEXT**: String literals enclosed in double quotes (`"Hello"`).
- **BOOLEAN**: Boolean values represented by `yes` (true) and `no` (false).
- **NOTHING**: Represents absence of value (`nothing`).

```noor
name := "Noor"
count := 10
isActive := yes
emptyValue := nothing
```

### 3. Arithmetic Operations
Supported operators: `+`, `-`, `*`, `/`, `%` with standard operator precedence and parenthesized grouping.

```noor
a := 10 + 5 * 2    # 20
b := (10 + 5) * 2  # 30
c := 10 / 2        # 5
d := 10 % 3        # 1
```

### 4. Comparisons & Logic
- **Comparison**: `>`, `<`, `>=`, `<=`, `==`, `!=`
- **Logical**: `and`, `or`, `not`

```noor
score := 85
isMember := yes

if score >= 80 and isMember:
    show "Discount Granted"
```

### 5. Control Flow (If / Else)
Noor uses indentation-based blocks with `:`:

```noor
age := 22

if age > 18:
    show "Adult"
    show "Allowed"
else:
    show "Not allowed"
```

### 6. Output (`show`)
The `show` statement outputs the evaluated expression directly to native stdout:

```noor
show "Hello, World!"
show 42
show yes
show nothing
```

---

## CLI Usage

Run Noor programs with the `noor` command:

### 1. Run a Program
```bash
noor conditions.noor
```
or
```bash
noor run conditions.noor
```

### 2. Compile to a Native Executable Binary
```bash
noor build conditions.noor
# Creates native binary ./conditions
./conditions
```

### 3. Build with Custom Output Name
```bash
noor build conditions.noor -o myapp
./myapp
```

---

## Examples

Example programs are in the `examples/` directory:

- [`examples/hello.noor`](examples/hello.noor) — Basic greeting output
- [`examples/variables.noor`](examples/variables.noor) — Variable creation and reassignment
- [`examples/arithmetic.noor`](examples/arithmetic.noor) — Math operations and operator precedence
- [`examples/conditions.noor`](examples/conditions.noor) — Indented `if` and `else` control flow

Run examples:
```bash
noor examples/hello.noor
noor examples/variables.noor
noor examples/arithmetic.noor
noor examples/conditions.noor
```

---

## Running Tests

```bash
npm test
```
