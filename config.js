// ============================================================
// ObraFácil — auth.js
// Gerenciamento de sessão
// Correções aplicadas:
//   ✅ Sessão com expiração (30 dias)
//   ✅ Sem senha armazenada localmente
//   ✅ Verificação de sessão expirada no carregamento
//   ✅ Limpeza segura no logout
// ============================================================

const Auth = (() => {

  let _profissional = null;

  // ── Salvar sessão com timestamp ───────────────────────────
  function salvar(prof) {
    try {
      const dados = {
        ...prof,
        _salvoEm: Date.now()
      };
      localStorage.setItem(ObraFacil.SESSION_KEY, JSON.stringify(dados));
      _profissional = prof;
    } catch (e) {
      console.warn('[Auth] Não foi possível salvar sessão:', e.message);
    }
  }

  // ── Carregar sessão verificando expiração ─────────────────
  function carregar() {
    try {
      const raw = localStorage.getItem(ObraFacil.SESSION_KEY);
      if (!raw) return null;
      const dados = JSON.parse(raw);

      // Verifica expiração
      const idade = Date.now() - (dados._salvoEm || 0);
      if (idade > ObraFacil.SESSION_TTL) {
        limpar();
        return null;
      }

      // Remove campo interno antes de usar
      const { _salvoEm, ...prof } = dados;
      _profissional = prof;
      return prof;
    } catch (e) {
      limpar();
      return null;
    }
  }

  // ── Limpar sessão completamente ───────────────────────────
  function limpar() {
    try {
      localStorage.removeItem(ObraFacil.SESSION_KEY);
      // Remove também sessões antigas (compatibilidade)
      localStorage.removeItem('obrafacil_sessao');
    } catch (e) {}
    _profissional = null;
  }

  // ── Atualizar créditos sem refazer login ──────────────────
  function atualizarCreditos(creditos) {
    if (_profissional) {
      _profissional.creditos = creditos;
      salvar(_profissional);
    }
  }

  // ── Getter do profissional logado ─────────────────────────
  function getProfissional() {
    return _profissional;
  }

  return { salvar, carregar, limpar, atualizarCreditos, getProfissional };
})();
