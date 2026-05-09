// ============================================================
// ObraFácil — api.js
// Comunicação com o backend (Apps Script)
// Correções aplicadas:
//   ✅ Token de validação em todas as chamadas
//   ✅ Tratamento robusto de erros (rede, JSON, quota)
//   ✅ Detecção de offline
//   ✅ Timeout de 30 segundos
//   ✅ Sanitização de outputs (prevenção XSS)
// ============================================================

const Api = (() => {

  // ── Sanitização contra XSS ────────────────────────────────
  function san(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Sanitiza objeto recursivamente ───────────────────────
  function sanObj(obj) {
    if (typeof obj !== 'object' || obj === null) return san(obj);
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        result[key] = typeof val === 'object' ? sanObj(val) : san(val);
      }
    }
    return result;
  }

  // ── Fetch com timeout ─────────────────────────────────────
  function fetchComTimeout(url, opcoes, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs);
      fetch(url, opcoes)
        .then(r => { clearTimeout(timer); resolve(r); })
        .catch(e => { clearTimeout(timer); reject(e); });
    });
  }

  // ── Chamada principal ─────────────────────────────────────
  async function chamar(acao, dados = {}) {
    // Detecta offline antes de tentar
    if (!navigator.onLine) {
      return { sucesso: false, offline: true, mensagem: 'Sem conexão com a internet. Verifique sua rede.' };
    }

    // Injeta token de segurança
    const payload = {
      acao,
      dados: { ...dados, _token: ObraFacil.APP_TOKEN }
    };

    try {
      const resp = await fetchComTimeout(
        ObraFacil.BACKEND_URL,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain' }
        },
        30000 // 30s timeout
      );

      if (!resp.ok) {
        return { sucesso: false, mensagem: `Servidor indisponível (${resp.status}). Tente novamente.` };
      }

      const texto = await resp.text();

      // Verifica se é JSON válido
      try {
        const json = JSON.parse(texto);
        // Sanitiza strings do resultado antes de usar no DOM
        return sanObj(json);
      } catch (_) {
        console.error('[ObraFácil] Resposta inválida do servidor:', texto.substring(0, 300));
        return { sucesso: false, mensagem: 'Erro interno no servidor. Tente novamente em instantes.' };
      }

    } catch (e) {
      if (e.message === 'TIMEOUT') {
        return { sucesso: false, mensagem: 'O servidor demorou muito para responder. Tente novamente.' };
      }
      if (!navigator.onLine) {
        return { sucesso: false, offline: true, mensagem: 'Conexão perdida. Verifique sua internet.' };
      }
      console.error('[ObraFácil] Erro de rede:', e.message);
      return { sucesso: false, mensagem: 'Erro de comunicação. Tente novamente.' };
    }
  }

  // Expõe apenas o necessário
  return { chamar, san };
})();
