#include "expjit.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int g_fail;

static void expect_ok(const char *expr, double *env, double want) {
    char err[128];
    ExpjitProgram *p = NULL;
    if (expjit_compile(expr, &p, err, sizeof(err)) != 0) {
        fprintf(stderr, "FAIL compile '%s': %s\n", expr, err);
        g_fail++;
        return;
    }
    double i = expjit_interp(p, env);
    double j = expjit_run(p, env);
    if (!(fabs(i - want) < 1e-9)) {
        fprintf(stderr, "FAIL interp '%s': got %.17g want %.17g\n", expr, i, want);
        g_fail++;
    }
    if (!(fabs(j - want) < 1e-9)) {
        fprintf(stderr, "FAIL run '%s': got %.17g want %.17g\n", expr, j, want);
        g_fail++;
    }
    if (expjit_has_jit(p) && !(fabs(i - j) < 1e-12)) {
        fprintf(stderr, "FAIL jit/interp mismatch '%s': interp %.17g jit %.17g\n", expr, i, j);
        g_fail++;
    }
    expjit_free(p);
}

static void expect_err(const char *expr) {
    char err[128];
    ExpjitProgram *p = NULL;
    if (expjit_compile(expr, &p, err, sizeof(err)) == 0) {
        fprintf(stderr, "FAIL expected error for '%s'\n", expr);
        g_fail++;
        expjit_free(p);
    }
}

int main(void) {
    expect_ok("1+2", NULL, 3);
    expect_ok("10-3-2", NULL, 5);
    expect_ok("2*3+4", NULL, 10);
    expect_ok("2*(3+4)", NULL, 14);
    expect_ok("-(2+3)", NULL, -5);
    expect_ok("--4", NULL, 4);
    expect_ok("8/2/2", NULL, 2);
    expect_ok("3.5*2", NULL, 7);
    expect_ok("(1)", NULL, 1);

    double env[4] = {3, 4, 0, 0};
    expect_ok("2*(x+1)", env, 8);
    expect_ok("x+y", env, 7);
    expect_ok("x*x + y*y", env, 25);

    char err[128];
    ExpjitProgram *p = NULL;
    if (expjit_compile("a+b*c", &p, err, sizeof(err)) != 0) {
        fprintf(stderr, "FAIL compile vars: %s\n", err);
        g_fail++;
    } else {
        if (expjit_nvars(p) != 3 || strcmp(expjit_varname(p, 0), "a") ||
            strcmp(expjit_varname(p, 1), "b") || strcmp(expjit_varname(p, 2), "c")) {
            fprintf(stderr, "FAIL variable intern order\n");
            g_fail++;
        }
        if (expjit_find_var(p, "b") != 1 || expjit_find_var(p, "z") != -1) {
            fprintf(stderr, "FAIL find_var\n");
            g_fail++;
        }
#if defined(__x86_64__) || defined(_M_X64)
        if (!expjit_has_jit(p)) {
            fprintf(stderr, "FAIL expected JIT on x86-64\n");
            g_fail++;
        }
#endif
        expjit_free(p);
    }

    expect_err("");
    expect_err("+1");
    expect_err("1+");
    expect_err("1+(2");
    expect_err("1+2)");
    expect_err("1 $ 2");
    expect_err("@");

    if (g_fail) {
        fprintf(stderr, "%d test(s) failed\n", g_fail);
        return 1;
    }
    puts("ok");
    return 0;
}
