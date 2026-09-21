#include "expjit.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define STORE_MAX 64
#define NAME_MAX 32

typedef struct {
    char names[STORE_MAX][NAME_MAX];
    double vals[STORE_MAX];
    int n;
} Store;

static void usage(FILE *fp) {
    fprintf(fp,
            "Usage: expjit [--interp] [<expr> [name=value ...]]\n"
            "\n"
            "With an expression, print one result and exit.\n"
            "With no expression, start a calculator prompt.\n"
            "\n"
            "  + - * / %%   ^ or **   unary +/-\n"
            "  pi e\n"
            "  sin cos tan sqrt abs exp ln log log10\n"
            "\n"
            "Prompt commands: name = expr, help, quit.\n");
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

static int store_find(Store *s, const char *name) {
    for (int i = 0; i < s->n; i++) {
        if (strcmp(s->names[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

static int store_set(Store *s, const char *name, double v) {
    int i = store_find(s, name);
    if (i >= 0) {
        s->vals[i] = v;
        return 0;
    }
    if (s->n >= STORE_MAX) {
        return -1;
    }
    snprintf(s->names[s->n], NAME_MAX, "%s", name);
    s->vals[s->n] = v;
    s->n++;
    return 0;
}

static int eval_text(const char *expr, Store *st, int use_interp, double *out, char *err, size_t errlen) {
    ExpjitProgram *p = NULL;
    if (expjit_compile(expr, &p, err, errlen) != 0) {
        return -1;
    }
    int n = expjit_nvars(p);
    double *env = calloc((size_t)n + 1, sizeof(double));
    if (!env) {
        snprintf(err, errlen, "out of memory");
        expjit_free(p);
        return -1;
    }
    for (int i = 0; i < n; i++) {
        int si = store_find(st, expjit_varname(p, i));
        env[i] = si >= 0 ? st->vals[si] : 0.0;
    }
    *out = use_interp ? expjit_interp(p, env) : expjit_run(p, env);
    free(env);
    expjit_free(p);
    return 0;
}

static int split_assign(char *line, char **name, char **rhs) {
    char *eq = strchr(line, '=');
    if (!eq) {
        return 0;
    }
    char *p = line;
    while (isspace((unsigned char)*p)) {
        p++;
    }
    if (!isalpha((unsigned char)*p) && *p != '_') {
        return 0;
    }
    char *start = p;
    p++;
    while (isalnum((unsigned char)*p) || *p == '_') {
        p++;
    }
    char *endname = p;
    while (isspace((unsigned char)*p)) {
        p++;
    }
    if (p != eq) {
        return 0;
    }
    *endname = '\0';
    *name = start;
    *rhs = eq + 1;
    return 1;
}

static void trim(char *s) {
    char *a = s;
    while (isspace((unsigned char)*a)) {
        a++;
    }
    if (a != s) {
        memmove(s, a, strlen(a) + 1);
    }
    size_t n = strlen(s);
    while (n > 0 && isspace((unsigned char)s[n - 1])) {
        s[--n] = '\0';
    }
}

static int run_line(char *line, Store *st, int use_interp) {
    trim(line);
    if (!line[0] || line[0] == '#') {
        return 0;
    }
    if (strcmp(line, "quit") == 0 || strcmp(line, "exit") == 0 || strcmp(line, "q") == 0) {
        return 1;
    }
    if (strcmp(line, "help") == 0 || strcmp(line, "?") == 0) {
        usage(stdout);
        return 0;
    }
    char err[256];
    double r;
    char *name = NULL;
    char *rhs = NULL;
    if (split_assign(line, &name, &rhs)) {
        if (strcmp(name, "pi") == 0 || strcmp(name, "PI") == 0 || strcmp(name, "e") == 0 ||
            strcmp(name, "E") == 0) {
            fprintf(stderr, "error: cannot assign to '%s'\n", name);
            return 0;
        }
        if (eval_text(rhs, st, use_interp, &r, err, sizeof(err)) != 0) {
            fprintf(stderr, "error: %s\n", err);
            return 0;
        }
        if (store_set(st, name, r) != 0) {
            fprintf(stderr, "error: too many variables\n");
            return 0;
        }
        printf("%s = %.17g\n", name, r);
        return 0;
    }
    if (eval_text(line, st, use_interp, &r, err, sizeof(err)) != 0) {
        fprintf(stderr, "error: %s\n", err);
        return 0;
    }
    printf("%.17g\n", r);
    return 0;
}

static int run_cli_expr(int argc, char **argv, int i, int use_interp) {
    Store st = {0};
    const char *expr = argv[i++];
    while (i < argc) {
        char *name = NULL;
        char *val = NULL;
        char *arg = argv[i];
        if (strncmp(arg, "--", 2) == 0 && arg[2] && !strchr(arg, '=')) {
            name = arg + 2;
            if (i + 1 >= argc) {
                fprintf(stderr, "error: missing value for --%s\n", name);
                return 2;
            }
            val = argv[++i];
        } else if (parse_binding(arg, &name, &val) != 0) {
            fprintf(stderr, "error: expected name=value or --name value, got '%s'\n", arg);
            return 2;
        }
        char *end = NULL;
        double v = strtod(val, &end);
        if (!end || *end) {
            fprintf(stderr, "error: invalid number '%s'\n", val);
            return 1;
        }
        if (store_set(&st, name, v) != 0) {
            fprintf(stderr, "error: too many variables\n");
            return 1;
        }
        i++;
    }
    char err[256];
    double r;
    if (eval_text(expr, &st, use_interp, &r, err, sizeof(err)) != 0) {
        fprintf(stderr, "error: %s\n", err);
        return 1;
    }
    printf("%.17g\n", r);
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
    if (i < argc) {
        return run_cli_expr(argc, argv, i, use_interp);
    }

    Store st = {0};
    char line[512];
    printf("ExpJIT — type an expression, or help / quit\n");
    while (1) {
        fputs("> ", stdout);
        fflush(stdout);
        if (!fgets(line, sizeof(line), stdin)) {
            putchar('\n');
            break;
        }
        if (run_line(line, &st, use_interp)) {
            break;
        }
    }
    return 0;
}
