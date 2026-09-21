#include "expjit.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void usage(FILE *fp) {
    fprintf(fp,
            "Usage: expjit [--interp] <expr> [name=value ...]\n"
            "       expjit [--interp] <expr> [--name value ...]\n"
            "\n"
            "Compile and evaluate an arithmetic expression.\n"
            "Variables default to 0 if omitted.\n");
}

static int parse_binding(char *arg, char **name, char **val) {
    char *eq = strchr(arg, '=');
    if (!eq || eq == arg || !eq[1]) {
        return -1;
    }
    *eq = '\0';
    *name = arg;
    *val = eq + 1;
    return 0;
}

int main(int argc, char **argv) {
    int use_interp = 0;
    int i = 1;
    if (i < argc && (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0)) {
        usage(stdout);
        return 0;
    }
    if (i < argc && strcmp(argv[i], "--interp") == 0) {
        use_interp = 1;
        i++;
    }
    if (i >= argc) {
        usage(stderr);
        return 2;
    }
    const char *expr = argv[i++];

    char err[256];
    ExpjitProgram *p = NULL;
    if (expjit_compile(expr, &p, err, sizeof(err)) != 0) {
        fprintf(stderr, "error: %s\n", err);
        return 1;
    }

    int n = expjit_nvars(p);
    double *env = calloc((size_t)n + 1, sizeof(double));
    if (!env) {
        fprintf(stderr, "error: out of memory\n");
        expjit_free(p);
        return 1;
    }

    while (i < argc) {
        char *name = NULL;
        char *val = NULL;
        char *arg = argv[i];
        if (strncmp(arg, "--", 2) == 0 && arg[2] && !strchr(arg, '=')) {
            name = arg + 2;
            if (i + 1 >= argc) {
                fprintf(stderr, "error: missing value for --%s\n", name);
                free(env);
                expjit_free(p);
                return 2;
            }
            val = argv[++i];
        } else if (parse_binding(arg, &name, &val) != 0) {
            fprintf(stderr, "error: expected name=value or --name value, got '%s'\n", arg);
            free(env);
            expjit_free(p);
            return 2;
        }
        int idx = expjit_find_var(p, name);
        if (idx < 0) {
            fprintf(stderr, "error: unused variable '%s'\n", name);
            free(env);
            expjit_free(p);
            return 1;
        }
        char *end = NULL;
        env[idx] = strtod(val, &end);
        if (!end || *end) {
            fprintf(stderr, "error: invalid number '%s'\n", val);
            free(env);
            expjit_free(p);
            return 1;
        }
        i++;
    }

    double r = use_interp ? expjit_interp(p, env) : expjit_run(p, env);
    printf("%.17g\n", r);
    free(env);
    expjit_free(p);
    return 0;
}
