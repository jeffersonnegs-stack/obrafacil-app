// ============================================================
// ObraFácil — js/api.js
// Camada de comunicação com o Google Apps Script
//
// Todas as chamadas ao backend passam por aqui.
// O Apps Script recebe via doPost e roteia pela "acao".
// ============================================================

const Api = (() => {

  // ── Sanitização básica contra XSS ────────────────────────
  function san(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Chamada principal ao backend ──────────────────────────
  async function chamar(acao, dados = {}) {
    const url = ObraFacil.SCRIPT_URL;

    // Verifica se a URL foi configurada
    if (!url || url.includes('COLE_AQUI')) {
      console.error('[Api] SCRIPT_URL não configurada em js/config.js');
      return {
        sucesso: false,
        mensagem: 'Backend não configurado. Configure a URL do Apps Script em js/config.js'
      };
    }

    // Injeta token de segurança
    const payload = {
      acao,
      dados: { ...dados, _token: ObraFacil.APP_TOKEN }
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (!resp.ok) {
        console.error('[Api] HTTP erro:', resp.status, resp.statusText);
        return {
          sucesso: false,
          mensagem: 'Erro de comunicação (' + resp.status + '). Tente novamente.'
        };
      }

      const texto = await resp.text();

      // Google às vezes redireciona e retorna HTML — detecta isso
      if (texto.trim().startsWith('<!') || texto.trim().startsWith('<html')) {
        console.error('[Api] Resposta HTML inesperada (possível redirecionamento OAuth)');
        return {
          sucesso: false,
          mensagem: 'Erro de autenticação com o servidor. Verifique a implantação do Apps Script.'
        };
      }

      try {
        return JSON.parse(texto);
      } catch (pe) {
        console.error('[Api] JSON inválido:', texto.substring(0, 200));
        return { sucesso: false, mensagem: 'Resposta inválida do servidor.' };
      }

    } catch (e) {
      console.error('[Api] Fetch error:', e.message);

      // Distingue erro de rede de outros erros
      if (!navigator.onLine) {
        return { sucesso: false, mensagem: 'Sem conexão com a internet. Verifique sua rede.' };
      }
      return { sucesso: false, mensagem: 'Erro de comunicação. Tente novamente.' };
    }
  }

  return { chamar, san };

})();
