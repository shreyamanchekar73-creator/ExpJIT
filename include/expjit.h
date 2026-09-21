#ifndef EXPJIT_H
#define EXPJIT_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct ExpjitProgram ExpjitProgram;

/* Compile an expression. On success returns 0 and sets *out. On failure
 * returns -1 and writes a message into err (if errlen > 0). */
int expjit_compile(const char *src, ExpjitProgram **out, char *err, size_t errlen);

int expjit_nvars(const ExpjitProgram *p);
const char *expjit_varname(const ExpjitProgram *p, int i);
int expjit_find_var(const ExpjitProgram *p, const char *name);

/* Evaluate with the interpreter (always available). env[i] is variable i. */
double expjit_interp(const ExpjitProgram *p, const double *env);

/* True if native x86-64 machine code was emitted. */
int expjit_has_jit(const ExpjitProgram *p);

/* Run JIT code if present, otherwise the interpreter. */
double expjit_run(const ExpjitProgram *p, const double *env);

void expjit_free(ExpjitProgram *p);

#ifdef __cplusplus
}
#endif

#endif
