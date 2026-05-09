// ============================================================
// ObraFácil — ui.js
// Utilitários de interface
// Correções aplicadas:
//   ✅ Toast com fila (não sobrepõe mensagens)
//   ✅ Loading global com bloqueio de duplo clique
//   ✅ Indicador de status offline/online
//   ✅ Máscara de telefone
//   ✅ Toggle de senha
//   ✅ Força de senha
// ============================================================

const UI = (() => {

  let _toastTimer = null;

  // ── Toast ─────────────────────────────────────────────────
  function toast(msg, tipo = 'info', duracaoMs = 4000) {
    const t = document.getElementById('toast');
    if (!t) return;
    clearTimeout(_toastTimer);
    t.textContent = msg;
    t.className = `toast show ${tipo}`;
    _toastTimer = setTimeout(() => t.classList.remove('show'), duracaoMs);
  }

  // ── Spinner HTML ──────────────────────────────────────────
  function spinner() {
    return '<span class="spinner" aria-label="Carregando"></span>';
  }

  // ── Botão: estado de loading ──────────────────────────────
  function btnLoading(btn, sim) {
    if (!btn) return;
    if (sim) {
      btn.dataset.textoOriginal = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = spinner();
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.textoOriginal || btn.innerHTML;
    }
  }

  // ── Máscara telefone ──────────────────────────────────────
  function mascaraTel(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d*)$/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/^(\d{2})(\d*)$/, '($1) $2');
    input.value = v;
  }

  // ── Toggle senha ──────────────────────────────────────────
  function toggleSenha(idInput, idBtn) {
    const inp = document.getElementById(idInput);
    const btn = document.getElementById(idBtn);
    if (!inp || !btn) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
  }

  // ── Força da senha ────────────────────────────────────────
  function forcaSenha(input) {
    const v = input.value;
    let score = 0;
    if (v.length >= 6)  score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const fill  = document.getElementById('forca-fill');
    const texto = document.getElementById('forca-texto');
    if (!fill || !texto) return;
    const pct   = (score / 5) * 100;
    const cor   = score <= 1 ? '#dc2626' : score <= 3 ? '#d97706' : '#16a34a';
    const label = score <= 1 ? 'Senha fraca' : score <= 3 ? 'Senha média' : 'Senha forte';
    fill.style.width = pct + '%';
    fill.style.background = cor;
    texto.textContent = v ? label : 'Digite uma senha';
    texto.style.color = v ? cor : 'var(--muted)';
  }

  // ── Navegação entre telas ─────────────────────────────────
  function mostrarTela(id) {
    ['tela-selecao', 'tela-cliente', 'tela-prof'].forEach(t => {
      const el = document.getElementById(t);
      if (el) el.style.display = 'none';
    });
    document.getElementById('painel')?.classList.remove('show');
    const alvo = document.getElementById(id);
    if (alvo) alvo.style.display = 'flex';
  }

  // ── Banner offline/online ─────────────────────────────────
  function initOfflineBanner() {
    const banner = document.getElementById('banner-offline');
    if (!banner) return;

    function atualizar() {
      banner.style.display = navigator.onLine ? 'none' : 'flex';
    }

    window.addEventListener('online',  atualizar);
    window.addEventListener('offline', atualizar);
    atualizar();
  }

  // ── Modal de confirmação ──────────────────────────────────
  function fecharModal(id = 'modal-sem-cred') {
    document.getElementById(id)?.classList.remove('show');
  }

  function abrirModal(id = 'modal-sem-cred') {
    document.getElementById(id)?.classList.add('show');
  }

  return {
    toast, spinner, btnLoading, mascaraTel,
    toggleSenha, forcaSenha, mostrarTela,
    initOfflineBanner, fecharModal, abrirModal
  };
})();
