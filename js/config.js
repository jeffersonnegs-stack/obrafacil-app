// ============================================================
// ObraFácil — config.js
// Configurações centralizadas do frontend
// ============================================================

const ObraFacil = {
  // URL do backend (Apps Script)
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz2E3FDBNkDeO-1c932h348H1armswP7XkUVPkq4eReSBIupJnpvuuTKnCpOLqbZ1Sw1A/exec',

  // Token de validação (deve bater com APP_TOKEN no Apps Script)
  APP_TOKEN: 'of_prod_2026_k9x',

  // WhatsApp admin
  WA_ADMIN: '5511971776347',

  // Sessão expira em 30 dias (ms)
  SESSION_TTL: 30 * 24 * 60 * 60 * 1000,

  // Chave do localStorage
  SESSION_KEY: 'obrafacil_sessao_v2',

  // Versão do cache PWA — mude aqui a cada deploy
  CACHE_VERSION: '2026-05-07-v1',
};

// Congela o objeto para evitar modificação acidental
Object.freeze(ObraFacil);
