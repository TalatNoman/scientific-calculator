/* ======================================================
   Architect-Grade Scientific Calculator Logic
   ------------------------------------------------------
   - Shunting Yard Algorithm for parsing
   - Full keyboard + button support
   - Memory registers
====================================================== */

const resultDisplay = document.getElementById("resultDisplay");
const operationDisplay = document.getElementById("operationDisplay");
const historyList = document.getElementById("historyList");
const memoryIndicator = document.getElementById("memoryIndicator");

let input = "";
let memory = 0;

/* =========================
   Operator Definitions
========================= */
const operators = {
  "+": { p: 1, assoc: "L", fn: (a, b) => a + b },
  "-": { p: 1, assoc: "L", fn: (a, b) => a - b },
  "*": { p: 2, assoc: "L", fn: (a, b) => a * b },
  "/": { p: 2, assoc: "L", fn: (a, b) => {
      if (b === 0) throw "Undefined";
      return a / b;
    }
  },
  "^": { p: 3, assoc: "R", fn: (a, b) => Math.pow(a, b) }
};

/* =========================
   Functions
========================= */
const functions = {
  sin: x => Math.sin(x),
  cos: x => Math.cos(x),
  tan: x => Math.tan(x),
  log: x => Math.log10(x),
  ln:  x => Math.log(x),
  sqrt: x => {
    if (x < 0) throw "Undefined";
    return Math.sqrt(x);
  }
};

/* =========================
   Tokenizer
========================= */
function tokenize(expr) {
  return expr
    .replace(/π/g, Math.PI)
    .replace(/e/g, Math.E)
    .match(/sin|cos|tan|log|ln|sqrt|\d+\.?\d*|\+|\-|\*|\/|\^|\(|\)/g);
}

/* =========================
   Shunting Yard Parser
========================= */
function toRPN(tokens) {
  const output = [];
  const stack = [];

  tokens.forEach(token => {
    if (!isNaN(token)) {
      output.push(Number(token));
    } else if (functions[token]) {
      stack.push(token);
    } else if (operators[token]) {
      while (
        stack.length &&
        operators[stack[stack.length - 1]] &&
        (
          operators[token].assoc === "L" &&
          operators[token].p <= operators[stack[stack.length - 1]].p
        )
      ) {
        output.push(stack.pop());
      }
      stack.push(token);
    } else if (token === "(") {
      stack.push(token);
    } else if (token === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") {
        output.push(stack.pop());
      }
      stack.pop();
      if (functions[stack[stack.length - 1]]) {
        output.push(stack.pop());
      }
    }
  });

  return output.concat(stack.reverse());
}

/* =========================
   RPN Evaluation
========================= */
function evalRPN(rpn) {
  const stack = [];
  rpn.forEach(token => {
    if (typeof token === "number") {
      stack.push(token);
    } else if (operators[token]) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(operators[token].fn(a, b));
    } else if (functions[token]) {
      stack.push(functions[token](stack.pop()));
    }
  });
  return stack.pop();
}

/* =========================
   Evaluate Expression
========================= */
function evaluateExpression(expr) {
  try {
    const tokens = tokenize(expr);
    const rpn = toRPN(tokens);
    return evalRPN(rpn);
  } catch {
    return "Error";
  }
}

/* =========================
   UI Updates
========================= */
function updateDisplay() {
  resultDisplay.textContent = input || "0";
  operationDisplay.textContent = input;
  memoryIndicator.style.visibility = memory !== 0 ? "visible" : "hidden";
}

/* =========================
   Event Handling
========================= */
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    handleInput(btn.dataset);
  });
});

function handleInput(data) {
  if (data.num) input += data.num;
  if (data.op) input += data.op;
  if (data.fn) input += data.fn + "(";

  if (data.action === "clear") input = "";
  if (data.action === "toggleSign") input = "-" + input;
  if (data.action === "invert") input = "1/(" + input + ")";

  if (data.action === "equals") {
    const result = evaluateExpression(input);
    historyList.innerHTML += `<li>${input} = ${result}</li>`;
    resultDisplay.classList.add("solve");
    setTimeout(() => resultDisplay.classList.remove("solve"), 300);
    input = String(result);
  }

  if (data.action === "mc") memory = 0;
  if (data.action === "mr") input += memory;
  if (data.action === "mplus") memory += Number(input) || 0;
  if (data.action === "mminus") memory -= Number(input) || 0;

  updateDisplay();
}

/* =========================
   Keyboard Support
========================= */
document.addEventListener("keydown", e => {
  if ("0123456789.+-*/()^".includes(e.key)) {
    input += e.key;
  }
  if (e.key === "Enter") handleInput({ action: "equals" });
  if (e.key === "Escape") input = "";
  updateDisplay();
});

updateDisplay();
