# ExpJIT

This repository also includes **Shriram Finance digital forms** for field staff: fill KYC + FATCA-CRS and the Fixed Deposit application on a computer, print A4, then get a pen signature on paper. See [`digital-forms/`](digital-forms/README.md).

```bash
cd digital-forms && npm install && npm run dev
```

---

# ExpJIT

A tiny **expression JIT**: type math, get a number. On x86-64 it compiles the expression to machine code; otherwise it still runs through an interpreter.

## Quick start

```bash
make
make test
./expjit '2*(x+1)' --x 3          # 8
./expjit 'sin(pi/2)'              # 1
./expjit                          # interactive prompt
```

In the prompt:

```
> x = 3
x = 3
> 2*(x+1)
8
> quit
```

## Language

```
expr     := term (('+' | '-') term)*
term     := unary (('*' | '/' | '%') unary)*
unary    := '+' unary | '-' unary | power
power    := primary (('^' | '**') unary)?
primary  := NUMBER | IDENT | IDENT '(' expr ')' | '(' expr ')'
```

| You type | Meaning |
| --- | --- |
| `+ - * / %` | add, sub, mul, div, remainder (`fmod`) |
| `^` or `**` | power (`2^3^2` is `512`) |
| `-2^2` | `-4` (power before unary minus) |
| `pi`, `e` | constants |
| `sin cos tan sqrt abs exp ln log log10` | functions (`log` is natural log) |

Numbers are IEEE doubles. Names are `[A-Za-z_][A-Za-z0-9_]*`. Missing variables are `0`.

## CLI

```bash
./expjit [--interp] [<expr> [name=value ...]]
./expjit 'x*x + y*y' x=3 y=4
./expjit --help
```

`--interp` uses the tree walker instead of JIT. No expression starts the prompt (`help`, `quit`, `name = expr`).

## Library

```c
#include "expjit.h"

ExpjitProgram *p;
char err[128];
if (expjit_compile("2*(x+1)", &p, err, sizeof err) != 0) { /* error */ }
double env[] = {3};
double r = expjit_run(p, env);
expjit_free(p);
```

## How the JIT works

1. Parse into an AST.
2. On x86-64, emit SSE2 `addsd` / `mulsd` / … and `call` into `pow`, `sin`, and friends.
3. Operand stack on `r8`; result in `xmm0`. Env pointer kept in `rbx`.
4. Constant pool after `ret`, RIP-relative loads; page set RX with `mprotect`.

Teaching-sized: no optimizer, no integers, no user-defined functions.

## Build

Needs a C11 compiler and POSIX `mmap` / `mprotect`.

```bash
make        # expjit
make test
make clean
```
