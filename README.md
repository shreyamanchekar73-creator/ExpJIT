# ExpJIT

A tiny **expression JIT**: parse an arithmetic expression, emit x86-64 machine code, and run it.

On non-x86-64 hosts the same AST still evaluates through a small interpreter.

## Language

```
expr     := term (('+' | '-') term)*
term     := unary (('*' | '/') unary)*
unary    := '-' unary | primary
primary  := NUMBER | IDENT | '(' expr ')'
```

- Numbers are IEEE `double` (`strtod` syntax).
- Names are `[A-Za-z_][A-Za-z0-9_]*`.
- Precedence: unary `-`, then `*` `/` (left), then `+` `-` (left).
- Division by zero follows IEEE floating-point rules.

## Build

```bash
make
make test
```

Needs a C11 compiler (`gcc` or `clang`) and a POSIX `mmap`/`mprotect` environment.

## CLI

```bash
./expjit '2*(x+1)' --x 3
# 8

./expjit 'x*x + y*y' x=3 y=4
# 25

./expjit --interp '1+2'
# 3
```

Omitted variables are `0`. `--interp` skips the JIT and uses the tree walker.

## Library

```c
#include "expjit.h"

ExpjitProgram *p;
char err[128];
expjit_compile("2*(x+1)", &p, err, sizeof err);
double env[] = {3}; /* env[i] matches expjit_varname(p, i) */
double r = expjit_run(p, env);
expjit_free(p);
```

`expjit_run` uses JIT code when `expjit_has_jit` is true, otherwise the interpreter.

## How the JIT works

1. Recursive-descent parser builds an AST.
2. On x86-64, a code buffer is filled with SSE2 `movsd` / `addsd` / `subsd` / `mulsd` / `divsd`.
3. Operands live on a small stack addressed by `r8`; the result is returned in `xmm0` (`double fn(const double *env)`).
4. Constants sit in a pool after `ret`, patched with RIP-relative loads.
5. The page is switched from RW to RX (`mprotect`) before the call.

There is no register allocator, no folding, and no integer type — this is a teaching-sized JIT, not LLVM.

## Limitations

- x86-64 System V only for native code (Linux/macOS).
- Caps: 32 variables, 512 AST nodes.
- No `^`, functions, or assignments.
- JIT code is not serialized; compile per process.
