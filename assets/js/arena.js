/* Arena programável da EJR: PF (frente), PT (trás), PE (gira esquerda), PD (gira direita). */
(function () {
  const N = 6;
  const START = { x: 0, y: 5, dir: 0 };            // dir: 0 cima, 1 direita, 2 baixo, 3 esquerda
  const TARGETS = [
    { x: 0, y: 1, cor: "orange" },
    { x: 3, y: 2, cor: "blue" },
    { x: 5, y: 5, cor: "robot" },
  ];
  const MAX = 24;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEP_MS = reduce ? 160 : 430;

  const $ = (id) => document.getElementById(id);
  const arena = $("arena"), campo = $("arena-campo"), lista = $("arena-programa");
  const status = $("arena-status"), contador = $("arena-contador");
  const bExec = $("arena-executar"), bUndo = $("arena-desfazer"), bReset = $("arena-limpar");
  if (!arena) return;

  let programa = [];
  let estado, angulo, rodando = false;

  // alvos
  const alvosEl = TARGETS.map((t, i) => {
    const el = document.createElement("div");
    el.className = "alvo alvo--" + t.cor;
    el.style.left = (t.x * 100) / N + "%";
    el.style.top = (t.y * 100) / N + "%";
    el.innerHTML = "<span>" + (i + 1) + "</span>";
    campo.appendChild(el);
    return el;
  });

  // robô visto de cima: corpo amarelo, rodas pretas, sensor laranja na frente
  const robo = document.createElement("div");
  robo.className = "robo";
  robo.innerHTML =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<rect x="14" y="30" width="14" height="40" rx="5" fill="#000"/>' +
    '<rect x="72" y="30" width="14" height="40" rx="5" fill="#000"/>' +
    '<rect x="25" y="22" width="50" height="58" rx="10" fill="#ffc21a" stroke="#000" stroke-width="5"/>' +
    '<rect x="36" y="44" width="28" height="22" rx="4" fill="#1e8fff" stroke="#000" stroke-width="4"/>' +
    '<circle cx="43" cy="55" r="3" fill="#22c93b"/><circle cx="57" cy="55" r="3" fill="#ff5a1f"/>' +
    '<path d="M36 22 L50 8 L64 22 Z" fill="#ff5a1f" stroke="#000" stroke-width="5" stroke-linejoin="round"/>' +
    "</svg>";
  campo.appendChild(robo);

  function desenha() {
    robo.style.transform = "translate(" + estado.x * 100 + "%, " + estado.y * 100 + "%)";
    robo.firstChild.style.transform = "rotate(" + angulo + "deg)";
  }

  function zera() {
    estado = { x: START.x, y: START.y, dir: START.dir, pegos: new Set() };
    angulo = 0;
    alvosEl.forEach((el) => el.classList.remove("is-got"));
    arena.classList.remove("is-win");
    contador.textContent = "0 de " + TARGETS.length;
    desenha();
  }

  function renderPrograma(ativo) {
    lista.innerHTML = "";
    programa.forEach((c, i) => {
      const li = document.createElement("li");
      li.dataset.cmd = c;
      li.textContent = c;
      if (i === ativo) li.classList.add("is-now");
      lista.appendChild(li);
    });
    bExec.disabled = rodando || programa.length === 0;
    bUndo.disabled = rodando || programa.length === 0;
  }

  function adiciona(cmd) {
    if (rodando) return;
    if (programa.length >= MAX) { status.textContent = "Limite de " + MAX + " comandos. Execute ou desfaça."; return; }
    programa.push(cmd);
    renderPrograma();
  }

  function passo(cmd) {
    if (cmd === "PE") { estado.dir = (estado.dir + 3) % 4; angulo -= 90; }
    else if (cmd === "PD") { estado.dir = (estado.dir + 1) % 4; angulo += 90; }
    else {
      const s = cmd === "PF" ? 1 : -1;
      const nx = estado.x + DX[estado.dir] * s, ny = estado.y + DY[estado.dir] * s;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) {
        robo.classList.remove("is-bump"); void robo.offsetWidth; robo.classList.add("is-bump");
        return "parede";
      }
      estado.x = nx; estado.y = ny;
      TARGETS.forEach((t, i) => {
        if (t.x === nx && t.y === ny && !estado.pegos.has(i)) {
          estado.pegos.add(i);
          alvosEl[i].classList.add("is-got");
        }
      });
      contador.textContent = estado.pegos.size + " de " + TARGETS.length;
    }
    desenha();
  }

  async function executa() {
    if (rodando || !programa.length) return;
    rodando = true;
    zera();
    renderPrograma();
    status.textContent = "Executando…";
    await espera(reduce ? 50 : 250);
    let bateu = 0;
    for (let i = 0; i < programa.length; i++) {
      renderPrograma(i);
      if (passo(programa[i]) === "parede") bateu++;
      await espera(STEP_MS);
      if (estado.pegos.size === TARGETS.length) break;
    }
    rodando = false;
    renderPrograma();
    const falta = TARGETS.length - estado.pegos.size;
    if (!falta) {
      arena.classList.add("is-win");
      status.textContent = "Pronto: você programou um robô. Agora imagine a sua turma.";
    } else {
      status.textContent = (bateu ? "O robô bateu na borda. " : "") +
        "Falta" + (falta > 1 ? "m " : " ") + falta + " alvo" + (falta > 1 ? "s" : "") + ". Ajuste e execute de novo.";
    }
  }

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  arena.querySelectorAll(".cmd").forEach((b) => b.addEventListener("click", () => adiciona(b.dataset.cmd)));
  bExec.addEventListener("click", executa);
  bUndo.addEventListener("click", () => { if (!rodando) { programa.pop(); renderPrograma(); } });
  bReset.addEventListener("click", () => {
    if (rodando) return;
    programa = []; zera(); renderPrograma();
    status.textContent = "Leve o robô aos 3 alvos";
  });

  // teclado: setas montam o programa quando o foco está na arena
  const TECLAS = { ArrowUp: "PF", ArrowDown: "PT", ArrowLeft: "PE", ArrowRight: "PD" };
  arena.addEventListener("keydown", (e) => {
    if (TECLAS[e.key]) { e.preventDefault(); adiciona(TECLAS[e.key]); }
    else if (e.key === "Backspace") { e.preventDefault(); bUndo.click(); }
  });

  zera();
  renderPrograma();
})();

/* Kits: filtro por tipo e orçamento pelo WhatsApp já com o nome do kit */
(function () {
  const FONE = "5551992921288";
  const filtros = document.querySelectorAll(".filtro");
  const kits = document.querySelectorAll(".kit");
  filtros.forEach((f) => f.addEventListener("click", () => {
    filtros.forEach((o) => { o.classList.toggle("is-on", o === f); o.setAttribute("aria-pressed", o === f); });
    kits.forEach((k) => { k.hidden = f.dataset.filtro !== "todos" && k.dataset.tipo !== f.dataset.filtro; });
  }));
  document.querySelectorAll(".kit__orc").forEach((a) => {
    const msg = "Olá, quero um orçamento do " + a.dataset.kit + ".";
    a.href = "https://wa.me/" + FONE + "?text=" + encodeURIComponent(msg);
    a.target = "_blank";
    a.rel = "noopener";
  });
})();
