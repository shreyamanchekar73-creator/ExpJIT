const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log,
  log10: Math.log10,
};
const CONSTS = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E };

class ParseError extends Error {}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    const col = i + 1;
    if (/\d/.test(c) || (c === "." && /\d/.test(src[i + 1] || ""))) {
      const m = src.slice(i).match(/^\d*\.?\d+(?:[eE][+-]?\d+)?/);
      if (!m) throw new ParseError(`column ${col}: invalid number`);
      tokens.push({ kind: "num", value: Number(m[0]), col });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      tokens.push({ kind: "ident", value: m[0], col });
      i += m[0].length;
      continue;
    }
    if (src.slice(i, i + 2) === "**") {
      tokens.push({ kind: "^", col });
      i += 2;
      continue;
    }
    const map = { "+": "+", "-": "-", "*": "*", "/": "/", "%": "%", "^": "^", "(": "(", ")": ")" };
    if (map[c]) {
      tokens.push({ kind: map[c], col });
      i += 1;
      continue;
    }
    throw new ParseError(`column ${col}: unexpected character '${c}'`);
  }
  tokens.push({ kind: "end", col: src.length + 1 });
  return tokens;
}

function parse(src) {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const eat = (kind) => {
    const t = peek();
    if (kind && t.kind !== kind) throw new ParseError(`column ${t.col}: expected ${kind}`);
    i += 1;
    return t;
  };

  function expr() {
    let left = term();
    while (peek().kind === "+" || peek().kind === "-") {
      const op = eat().kind;
      left = { type: "bin", op, left, right: term() };
    }
    return left;
  }
  function term() {
    let left = unary();
    while (peek().kind === "*" || peek().kind === "/" || peek().kind === "%") {
      const op = eat().kind;
      left = { type: "bin", op, left, right: unary() };
    }
    return left;
  }
  function unary() {
    if (peek().kind === "+") {
      eat();
      return unary();
    }
    if (peek().kind === "-") {
      eat();
      return { type: "neg", inner: unary() };
    }
    return power();
  }
  function power() {
    const left = primary();
    if (peek().kind === "^") {
      eat();
      return { type: "bin", op: "^", left, right: unary() };
    }
    return left;
  }
  function primary() {
    const t = peek();
    if (t.kind === "num") {
      eat();
      return { type: "num", value: t.value };
    }
    if (t.kind === "ident") {
      eat();
      if (peek().kind === "(") {
        if (!FUNCS[t.value]) throw new ParseError(`column ${t.col}: unknown function '${t.value}'`);
        eat("(");
        const arg = expr();
        eat(")");
        return { type: "call", name: t.value, arg };
      }
      if (CONSTS[t.value] !== undefined) return { type: "num", value: CONSTS[t.value] };
      return { type: "var", name: t.value };
    }
    if (t.kind === "(") {
      eat();
      const inner = expr();
      eat(")");
      return inner;
    }
    throw new ParseError(`column ${t.col}: expected number, name, function, or '('`);
  }

  const ast = expr();
  if (peek().kind !== "end") throw new ParseError(`column ${peek().col}: unexpected trailing input`);
  return ast;
}

function collectVars(node, out) {
  if (node.type === "var") {
    if (!out.includes(node.name)) out.push(node.name);
  } else if (node.type === "neg") collectVars(node.inner, out);
  else if (node.type === "bin") {
    collectVars(node.left, out);
    collectVars(node.right, out);
  } else if (node.type === "call") collectVars(node.arg, out);
}

function evalNode(node, env) {
  switch (node.type) {
    case "num":
      return node.value;
    case "var":
      return env[node.name] ?? 0;
    case "neg":
      return -evalNode(node.inner, env);
    case "call":
      return FUNCS[node.name](evalNode(node.arg, env));
    case "bin": {
      const a = evalNode(node.left, env);
      const b = evalNode(node.right, env);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      if (node.op === "/") return a / b;
      if (node.op === "%") return a % b;
      if (node.op === "^") return a ** b;
    }
  }
  return NaN;
}

const exprInput = document.getElementById("expr");
const varsBox = document.getElementById("vars");
const out = document.getElementById("out");
const varInputs = {};

function renderVars(names) {
  const keep = {};
  for (const name of names) keep[name] = varInputs[name]?.value ?? "0";
  varsBox.innerHTML = "";
  Object.keys(varInputs).forEach((k) => delete varInputs[k]);
  for (const name of names) {
    const row = document.createElement("div");
    row.className = "var-row";
    const lab = document.createElement("label");
    lab.textContent = name;
    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = "any";
    inp.value = keep[name];
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") calculate();
    });
    row.append(lab, inp);
    varsBox.append(row);
    varInputs[name] = inp;
  }
}

function calculate() {
  out.classList.remove("error");
  try {
    const ast = parse(exprInput.value.trim() || "0");
    const names = [];
    collectVars(ast, names);
    renderVars(names);
    const env = {};
    for (const name of names) env[name] = Number(varInputs[name].value);
    const value = evalNode(ast, env);
    out.textContent = Number.isFinite(value) ? String(value) : String(value);
  } catch (err) {
    out.classList.add("error");
    out.textContent = err.message || String(err);
  }
}

exprInput.addEventListener("input", () => {
  try {
    const ast = parse(exprInput.value.trim() || "0");
    const names = [];
    collectVars(ast, names);
    renderVars(names);
    out.textContent = "";
    out.classList.remove("error");
  } catch {
    /* wait until Calculate */
  }
});
exprInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") calculate();
});
document.getElementById("run").addEventListener("click", calculate);
exprInput.value = "2*(x+1)";
calculate();
