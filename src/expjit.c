#define _DEFAULT_SOURCE
#include "expjit.h"

#include <ctype.h>
#include <errno.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

#define MAX_VARS 32
#define MAX_NAME 32
#define MAX_NODES 512
#define MAX_CONSTS 256
#define MAX_PATCHES 256
#define JIT_CAP (64 * 1024)

typedef enum {
    ND_NUM,
    ND_VAR,
    ND_NEG,
    ND_ADD,
    ND_SUB,
    ND_MUL,
    ND_DIV
} NodeKind;

typedef struct {
    NodeKind kind;
    int left;
    int right;
    double num;
    int var;
} Node;

struct ExpjitProgram {
    Node nodes[MAX_NODES];
    int nnodes;
    int root;
    char vars[MAX_VARS][MAX_NAME];
    int nvars;
    void *jit;
    size_t jit_size;
    double (*jit_fn)(const double *env);
};

typedef enum {
    TK_END,
    TK_NUM,
    TK_IDENT,
    TK_PLUS,
    TK_MINUS,
    TK_STAR,
    TK_SLASH,
    TK_LPAREN,
    TK_RPAREN,
    TK_ERR
} TokKind;

typedef struct {
    const char *src;
    size_t i;
    TokKind kind;
    double num;
    char ident[MAX_NAME];
    char err[128];
} Lexer;

typedef struct {
    Lexer *lx;
    ExpjitProgram *p;
    char *err;
    size_t errlen;
} Parser;

static void set_err(char *err, size_t errlen, const char *msg) {
    if (err && errlen) {
        snprintf(err, errlen, "%s", msg);
    }
}

static void skip_ws(Lexer *lx) {
    while (lx->src[lx->i] && isspace((unsigned char)lx->src[lx->i])) {
        lx->i++;
    }
}

static void lex_next(Lexer *lx) {
    skip_ws(lx);
    char c = lx->src[lx->i];
    if (!c) {
        lx->kind = TK_END;
        return;
    }
    if (isdigit((unsigned char)c) || (c == '.' && isdigit((unsigned char)lx->src[lx->i + 1]))) {
        char *end = NULL;
        errno = 0;
        lx->num = strtod(lx->src + lx->i, &end);
        if (end == lx->src + lx->i || errno == ERANGE) {
            lx->kind = TK_ERR;
            snprintf(lx->err, sizeof(lx->err), "invalid number");
            return;
        }
        lx->i = (size_t)(end - lx->src);
        lx->kind = TK_NUM;
        return;
    }
    if (isalpha((unsigned char)c) || c == '_') {
        size_t n = 0;
        while (isalnum((unsigned char)lx->src[lx->i]) || lx->src[lx->i] == '_') {
            if (n + 1 >= MAX_NAME) {
                lx->kind = TK_ERR;
                snprintf(lx->err, sizeof(lx->err), "variable name too long");
                return;
            }
            lx->ident[n++] = lx->src[lx->i++];
        }
        lx->ident[n] = '\0';
        lx->kind = TK_IDENT;
        return;
    }
    lx->i++;
    switch (c) {
    case '+':
        lx->kind = TK_PLUS;
        return;
    case '-':
        lx->kind = TK_MINUS;
        return;
    case '*':
        lx->kind = TK_STAR;
        return;
    case '/':
        lx->kind = TK_SLASH;
        return;
    case '(':
        lx->kind = TK_LPAREN;
        return;
    case ')':
        lx->kind = TK_RPAREN;
        return;
    default:
        lx->kind = TK_ERR;
        snprintf(lx->err, sizeof(lx->err), "unexpected character '%c'", c);
        return;
    }
}

static int intern_var(ExpjitProgram *p, const char *name, char *err, size_t errlen) {
    for (int i = 0; i < p->nvars; i++) {
        if (strcmp(p->vars[i], name) == 0) {
            return i;
        }
    }
    if (p->nvars >= MAX_VARS) {
        set_err(err, errlen, "too many variables");
        return -1;
    }
    snprintf(p->vars[p->nvars], MAX_NAME, "%s", name);
    return p->nvars++;
}

static int add_node(Parser *ps, Node n) {
    if (ps->p->nnodes >= MAX_NODES) {
        set_err(ps->err, ps->errlen, "expression too large");
        return -1;
    }
    int id = ps->p->nnodes++;
    ps->p->nodes[id] = n;
    return id;
}

static int parse_expr(Parser *ps);

static int parse_primary(Parser *ps) {
    Lexer *lx = ps->lx;
    if (lx->kind == TK_NUM) {
        Node n = {0};
        n.kind = ND_NUM;
        n.num = lx->num;
        lex_next(lx);
        return add_node(ps, n);
    }
    if (lx->kind == TK_IDENT) {
        int v = intern_var(ps->p, lx->ident, ps->err, ps->errlen);
        if (v < 0) {
            return -1;
        }
        Node n = {0};
        n.kind = ND_VAR;
        n.var = v;
        lex_next(lx);
        return add_node(ps, n);
    }
    if (lx->kind == TK_LPAREN) {
        lex_next(lx);
        int e = parse_expr(ps);
        if (e < 0) {
            return -1;
        }
        if (lx->kind != TK_RPAREN) {
            set_err(ps->err, ps->errlen, "expected ')'");
            return -1;
        }
        lex_next(lx);
        return e;
    }
    if (lx->kind == TK_ERR) {
        set_err(ps->err, ps->errlen, lx->err);
        return -1;
    }
    set_err(ps->err, ps->errlen, "expected number, variable, or '('");
    return -1;
}

static int parse_unary(Parser *ps) {
    if (ps->lx->kind == TK_MINUS) {
        lex_next(ps->lx);
        int c = parse_unary(ps);
        if (c < 0) {
            return -1;
        }
        Node n = {0};
        n.kind = ND_NEG;
        n.left = c;
        return add_node(ps, n);
    }
    return parse_primary(ps);
}

static int parse_term(Parser *ps) {
    int left = parse_unary(ps);
    if (left < 0) {
        return -1;
    }
    while (ps->lx->kind == TK_STAR || ps->lx->kind == TK_SLASH) {
        NodeKind k = ps->lx->kind == TK_STAR ? ND_MUL : ND_DIV;
        lex_next(ps->lx);
        int right = parse_unary(ps);
        if (right < 0) {
            return -1;
        }
        Node n = {0};
        n.kind = k;
        n.left = left;
        n.right = right;
        left = add_node(ps, n);
        if (left < 0) {
            return -1;
        }
    }
    return left;
}

static int parse_expr(Parser *ps) {
    int left = parse_term(ps);
    if (left < 0) {
        return -1;
    }
    while (ps->lx->kind == TK_PLUS || ps->lx->kind == TK_MINUS) {
        NodeKind k = ps->lx->kind == TK_PLUS ? ND_ADD : ND_SUB;
        lex_next(ps->lx);
        int right = parse_term(ps);
        if (right < 0) {
            return -1;
        }
        Node n = {0};
        n.kind = k;
        n.left = left;
        n.right = right;
        left = add_node(ps, n);
        if (left < 0) {
            return -1;
        }
    }
    return left;
}

static double eval_node(const ExpjitProgram *p, int id, const double *env) {
    const Node *n = &p->nodes[id];
    switch (n->kind) {
    case ND_NUM:
        return n->num;
    case ND_VAR:
        return env ? env[n->var] : 0.0;
    case ND_NEG:
        return -eval_node(p, n->left, env);
    case ND_ADD:
        return eval_node(p, n->left, env) + eval_node(p, n->right, env);
    case ND_SUB:
        return eval_node(p, n->left, env) - eval_node(p, n->right, env);
    case ND_MUL:
        return eval_node(p, n->left, env) * eval_node(p, n->right, env);
    case ND_DIV:
        return eval_node(p, n->left, env) / eval_node(p, n->right, env);
    }
    return NAN;
}

double expjit_interp(const ExpjitProgram *p, const double *env) {
    if (!p) {
        return NAN;
    }
    return eval_node(p, p->root, env);
}

int expjit_nvars(const ExpjitProgram *p) {
    return p ? p->nvars : 0;
}

const char *expjit_varname(const ExpjitProgram *p, int i) {
    if (!p || i < 0 || i >= p->nvars) {
        return NULL;
    }
    return p->vars[i];
}

int expjit_find_var(const ExpjitProgram *p, const char *name) {
    if (!p || !name) {
        return -1;
    }
    for (int i = 0; i < p->nvars; i++) {
        if (strcmp(p->vars[i], name) == 0) {
            return i;
        }
    }
    return -1;
}

int expjit_has_jit(const ExpjitProgram *p) {
    return p && p->jit_fn != NULL;
}

double expjit_run(const ExpjitProgram *p, const double *env) {
    if (!p) {
        return NAN;
    }
    if (p->jit_fn) {
        return p->jit_fn(env);
    }
    return expjit_interp(p, env);
}

void expjit_free(ExpjitProgram *p) {
    if (!p) {
        return;
    }
    if (p->jit) {
        munmap(p->jit, p->jit_size);
    }
    free(p);
}

#if defined(__x86_64__) || defined(_M_X64)

typedef struct {
    uint8_t *buf;
    size_t cap;
    size_t len;
    double consts[MAX_CONSTS];
    int nconst;
    size_t patches[MAX_PATCHES];
    int patch_ci[MAX_PATCHES];
    int npatch;
    int failed;
} Asm;

static void emit_bytes(Asm *a, const uint8_t *b, size_t n) {
    if (a->failed) {
        return;
    }
    if (a->len + n > a->cap) {
        a->failed = 1;
        return;
    }
    memcpy(a->buf + a->len, b, n);
    a->len += n;
}

static void emit1(Asm *a, uint8_t x) { emit_bytes(a, &x, 1); }

static void emit4(Asm *a, uint32_t v) {
    uint8_t b[4];
    b[0] = (uint8_t)(v);
    b[1] = (uint8_t)(v >> 8);
    b[2] = (uint8_t)(v >> 16);
    b[3] = (uint8_t)(v >> 24);
    emit_bytes(a, b, 4);
}

static int intern_const(Asm *a, double v) {
    for (int i = 0; i < a->nconst; i++) {
        if (memcmp(&a->consts[i], &v, sizeof(double)) == 0) {
            return i;
        }
    }
    if (a->nconst >= MAX_CONSTS) {
        a->failed = 1;
        return 0;
    }
    a->consts[a->nconst] = v;
    return a->nconst++;
}

/* movsd xmm0, [rip+rel32] */
static void emit_load_const(Asm *a, double v) {
    int ci = intern_const(a, v);
    emit1(a, 0xF2);
    emit1(a, 0x0F);
    emit1(a, 0x10);
    emit1(a, 0x05); /* ModRM: disp32(rip) -> xmm0 */
    if (a->npatch >= MAX_PATCHES) {
        a->failed = 1;
        return;
    }
    a->patches[a->npatch] = a->len;
    a->patch_ci[a->npatch] = ci;
    a->npatch++;
    emit4(a, 0);
}

/* movsd xmm0, [rdi + 8*idx] */
static void emit_load_var(Asm *a, int idx) {
    int32_t disp = (int32_t)(idx * 8);
    emit1(a, 0xF2);
    emit1(a, 0x0F);
    emit1(a, 0x10);
    if (disp == 0) {
        emit1(a, 0x07); /* [rdi] */
    } else if (disp >= -128 && disp <= 127) {
        emit1(a, 0x47);
        emit1(a, (uint8_t)disp);
    } else {
        emit1(a, 0x87);
        emit4(a, (uint32_t)disp);
    }
}

/* movsd [r8], xmm0 ; add r8, 8 */
static void emit_push_xmm0(Asm *a) {
    emit1(a, 0xF2);
    emit1(a, 0x41);
    emit1(a, 0x0F);
    emit1(a, 0x11);
    emit1(a, 0x00);
    emit1(a, 0x49);
    emit1(a, 0x83);
    emit1(a, 0xC0);
    emit1(a, 0x08);
}

/* sub r8, 8 ; movsd xmm1, [r8] */
static void emit_pop_xmm1(Asm *a) {
    emit1(a, 0x49);
    emit1(a, 0x83);
    emit1(a, 0xE8);
    emit1(a, 0x08);
    emit1(a, 0xF2);
    emit1(a, 0x41);
    emit1(a, 0x0F);
    emit1(a, 0x10);
    emit1(a, 0x08);
}

/* sub r8, 8 ; movsd xmm0, [r8] */
static void emit_pop_xmm0(Asm *a) {
    emit1(a, 0x49);
    emit1(a, 0x83);
    emit1(a, 0xE8);
    emit1(a, 0x08);
    emit1(a, 0xF2);
    emit1(a, 0x41);
    emit1(a, 0x0F);
    emit1(a, 0x10);
    emit1(a, 0x00);
}

static void emit_binop(Asm *a, NodeKind k) {
    emit_pop_xmm1(a); /* right */
    emit_pop_xmm0(a); /* left */
    emit1(a, 0xF2);
    emit1(a, 0x0F);
    switch (k) {
    case ND_ADD:
        emit1(a, 0x58);
        break;
    case ND_SUB:
        emit1(a, 0x5C);
        break;
    case ND_MUL:
        emit1(a, 0x59);
        break;
    case ND_DIV:
        emit1(a, 0x5E);
        break;
    default:
        a->failed = 1;
        return;
    }
    emit1(a, 0xC1); /* xmm0, xmm1 */
    emit_push_xmm0(a);
}

static void emit_neg(Asm *a) {
    emit_pop_xmm0(a);
    /* xorpd xmm1, xmm1 */
    emit1(a, 0x66);
    emit1(a, 0x0F);
    emit1(a, 0x57);
    emit1(a, 0xC9);
    /* subsd xmm1, xmm0 */
    emit1(a, 0xF2);
    emit1(a, 0x0F);
    emit1(a, 0x5C);
    emit1(a, 0xC8);
    /* movsd xmm0, xmm1 */
    emit1(a, 0xF2);
    emit1(a, 0x0F);
    emit1(a, 0x10);
    emit1(a, 0xC1);
    emit_push_xmm0(a);
}

static void emit_node(Asm *a, const ExpjitProgram *p, int id) {
    const Node *n = &p->nodes[id];
    switch (n->kind) {
    case ND_NUM:
        emit_load_const(a, n->num);
        emit_push_xmm0(a);
        break;
    case ND_VAR:
        emit_load_var(a, n->var);
        emit_push_xmm0(a);
        break;
    case ND_NEG:
        emit_node(a, p, n->left);
        emit_neg(a);
        break;
    case ND_ADD:
    case ND_SUB:
    case ND_MUL:
    case ND_DIV:
        emit_node(a, p, n->left);
        emit_node(a, p, n->right);
        emit_binop(a, n->kind);
        break;
    }
}

static int emit_jit(ExpjitProgram *p) {
    long page = sysconf(_SC_PAGESIZE);
    if (page <= 0) {
        page = 4096;
    }
    size_t cap = (size_t)page;
    while (cap < JIT_CAP) {
        cap *= 2;
        if (cap > JIT_CAP * 2) {
            break;
        }
    }
    void *mem = mmap(NULL, cap, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (mem == MAP_FAILED) {
        return -1;
    }

    Asm a = {0};
    a.buf = mem;
    a.cap = cap;

    /* prologue: push rbp; mov rbp, rsp; sub rsp, 512; lea r8, [rsp] */
    emit1(&a, 0x55);
    emit1(&a, 0x48);
    emit1(&a, 0x89);
    emit1(&a, 0xE5);
    emit1(&a, 0x48);
    emit1(&a, 0x81);
    emit1(&a, 0xEC);
    emit4(&a, 512);
    /* lea r8, [rsp] */
    emit1(&a, 0x4C);
    emit1(&a, 0x8D);
    emit1(&a, 0x04);
    emit1(&a, 0x24);

    emit_node(&a, p, p->root);
    emit_pop_xmm0(&a);

    /* mov rsp, rbp; pop rbp; ret */
    emit1(&a, 0x48);
    emit1(&a, 0x89);
    emit1(&a, 0xEC);
    emit1(&a, 0x5D);
    emit1(&a, 0xC3);

    /* align constant pool to 8 */
    while ((a.len & 7) != 0) {
        emit1(&a, 0x90);
    }
    size_t pool = a.len;
    for (int i = 0; i < a.nconst; i++) {
        emit_bytes(&a, (const uint8_t *)&a.consts[i], 8);
    }

    for (int i = 0; i < a.npatch; i++) {
        size_t at = a.patches[i];
        size_t target = pool + (size_t)a.patch_ci[i] * 8;
        int32_t rel = (int32_t)((int64_t)target - (int64_t)(at + 4));
        a.buf[at + 0] = (uint8_t)rel;
        a.buf[at + 1] = (uint8_t)(rel >> 8);
        a.buf[at + 2] = (uint8_t)(rel >> 16);
        a.buf[at + 3] = (uint8_t)(rel >> 24);
    }

    if (a.failed) {
        munmap(mem, cap);
        return -1;
    }

    if (mprotect(mem, cap, PROT_READ | PROT_EXEC) != 0) {
        munmap(mem, cap);
        return -1;
    }

    p->jit = mem;
    p->jit_size = cap;
    p->jit_fn = (double (*)(const double *))mem;
    return 0;
}

#else

static int emit_jit(ExpjitProgram *p) {
    (void)p;
    return -1;
}

#endif

int expjit_compile(const char *src, ExpjitProgram **out, char *err, size_t errlen) {
    if (!src || !out) {
        set_err(err, errlen, "invalid arguments");
        return -1;
    }
    *out = NULL;
    ExpjitProgram *p = calloc(1, sizeof(*p));
    if (!p) {
        set_err(err, errlen, "out of memory");
        return -1;
    }

    Lexer lx = {0};
    lx.src = src;
    lex_next(&lx);
    if (lx.kind == TK_ERR) {
        set_err(err, errlen, lx.err);
        free(p);
        return -1;
    }

    Parser ps = {0};
    ps.lx = &lx;
    ps.p = p;
    ps.err = err;
    ps.errlen = errlen;

    int root = parse_expr(&ps);
    if (root < 0) {
        free(p);
        return -1;
    }
    if (lx.kind == TK_ERR) {
        set_err(err, errlen, lx.err);
        free(p);
        return -1;
    }
    if (lx.kind != TK_END) {
        set_err(err, errlen, "unexpected trailing input");
        free(p);
        return -1;
    }
    p->root = root;
    (void)emit_jit(p);
    *out = p;
    return 0;
}
