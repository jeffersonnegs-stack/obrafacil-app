// ============================================================
// ObraFÃ¡cil â€” app.js
// LÃ³gica principal do aplicativo
// CorreÃ§Ãµes aplicadas:
//   âœ… Timers limpos corretamente em todas as situaÃ§Ãµes
//   âœ… Sem duplo clique em botÃµes
//   âœ… SanitizaÃ§Ã£o XSS em todos os renders
//   âœ… Tratamento de erro em todas as chamadas
//   âœ… Loading spinner na inicializaÃ§Ã£o
//   âœ… SessÃ£o com expiraÃ§Ã£o via Auth module
// ============================================================

const App = (() => {

  // â”€â”€ Estado interno â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let _materialSelecionado = '';
  let _timersDeadline = {};

  // â”€â”€ Limpar todos os timers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _limparTimers() {
    Object.values(_timersDeadline).forEach(t => clearInterval(t));
    _timersDeadline = {};
  }

  // â”€â”€ NavegaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function irParaCliente() {
    UI.mostrarTela('tela-cliente');
    const params = new URLSearchParams(window.location.search);
    document.getElementById('campo-origem').value =
      params.get('utm_source') || params.get('origem') || 'App';
  }

  function irParaProfissional() {
    UI.mostrarTela('tela-prof');
  }

  function voltarSelecao() {
    _limparTimers();
    UI.mostrarTela('tela-selecao');
  }

  // â”€â”€ FormulÃ¡rio cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function selecionarMaterial(valor) {
    _materialSelecionado = valor;
    document.getElementById('campo-material').value = valor;
    document.getElementById('btn-material-sim').className =
      'opcao-btn' + (valor === 'Sim' ? ' sim' : '');
    document.getElementById('btn-material-nao').className =
      'opcao-btn' + (valor === 'Nao' ? ' nao' : '');
  }

  async function enviarLead(e) {
    e.preventDefault();
    const msgEl = document.getElementById('msg-cliente');
    msgEl.style.display = 'none';

    if (!_materialSelecionado) {
      msgEl.className = 'msg-form erro';
      msgEl.textContent = 'Por favor, responda se vai comprar o material conosco.';
      msgEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('btn-enviar-lead');
    UI.btnLoading(btn, true);

    const dados = Object.fromEntries(new FormData(e.target));

    const r = await Api.chamar('adicionarLeadPublico', dados);

    UI.btnLoading(btn, false);
    msgEl.style.display = 'block';

    if (r.sucesso) {
      msgEl.className = 'msg-form ok';
      msgEl.textContent = 'SolicitaÃ§Ã£o enviada! Em breve um profissional chamarÃ¡ no WhatsApp.';
      e.target.reset();
      _materialSelecionado = '';
      document.getElementById('btn-material-sim').className = 'opcao-btn';
      document.getElementById('btn-material-nao').className = 'opcao-btn';
      document.getElementById('campo-material').value = '';
    } else {
      msgEl.className = 'msg-form erro';
      msgEl.textContent = r.mensagem || 'Erro ao enviar. Tente novamente.';
    }
  }

  // â”€â”€ Abas login/cadastro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function mostrarAba(aba) {
    const eLogin = aba === 'login';
    document.getElementById('form-login').style.display    = eLogin ? 'block' : 'none';
    document.getElementById('form-cadastro').style.display = eLogin ? 'none'  : 'block';
    document.getElementById('tab-login-btn').classList.toggle('on', eLogin);
    document.getElementById('tab-cad-btn').classList.toggle('on', !eLogin);
    document.getElementById('card-auth').style.display     = 'block';
    document.getElementById('card-pendente').style.display = 'none';
    document.getElementById('login-erro').style.display    = 'none';
    document.getElementById('cad-erro').style.display      = 'none';
    document.getElementById('cad-ok').style.display        = 'none';
  }

  // â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function entrar() {
    const tel   = document.getElementById('inp-tel').value;
    const senha = document.getElementById('inp-senha').value;
    const erroDiv = document.getElementById('login-erro');
    erroDiv.style.display = 'none';

    if (tel.replace(/\D/g, '').length < 10) {
      erroDiv.textContent = 'Digite um nÃºmero de WhatsApp vÃ¡lido.';
      erroDiv.style.display = 'block'; return;
    }
    if (!senha) {
      erroDiv.textContent = 'Digite sua senha.';
      erroDiv.style.display = 'block'; return;
    }

    const btn = document.getElementById('btn-entrar');
    UI.btnLoading(btn, true);

    const r = await Api.chamar('loginProfissional', { telefone: tel, senha });

    UI.btnLoading(btn, false);

    if (!r.sucesso) {
      if (r.naoEncontrado) {
        erroDiv.innerHTML = Api.san(r.mensagem)
          + '<br><br><button onclick="App.mostrarAba(\'cadastro\')" '
          + 'style="background:var(--laranja);color:#fff;border:none;border-radius:8px;'
          + 'padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;margin-top:4px">'
          + 'Fazer cadastro agora</button>';
      } else {
        erroDiv.textContent = r.mensagem || 'Erro ao entrar. Tente novamente.';
      }
      erroDiv.style.display = 'block'; return;
    }

    Auth.salvar(r.profissional);
    _iniciarPainel(r.profissional);
  }

  // â”€â”€ Cadastro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function cadastrar() {
    const nome   = document.getElementById('cad-nome').value.trim();
    const tel    = document.getElementById('cad-tel').value.trim();
    const prof   = document.getElementById('cad-prof').value;
    const cidade = document.getElementById('cad-cidade').value.trim();
    const senha  = document.getElementById('cad-senha').value;
    const senha2 = document.getElementById('cad-senha2').value;
    const obs    = document.getElementById('cad-obs').value.trim();
    const erroDiv = document.getElementById('cad-erro');
    erroDiv.style.display = 'none';

    // ValidaÃ§Ãµes
    if (!nome || nome.length < 3) {
      erroDiv.textContent = 'Digite seu nome completo (mÃ­nimo 3 caracteres).';
      erroDiv.style.display = 'block'; return;
    }
    if (tel.replace(/\D/g, '').length < 10) {
      erroDiv.textContent = 'Digite um WhatsApp vÃ¡lido com DDD.';
      erroDiv.style.display = 'block'; return;
    }
    if (!prof) {
      erroDiv.textContent = 'Selecione sua profissÃ£o.';
      erroDiv.style.display = 'block'; return;
    }
    if (!cidade) {
      erroDiv.textContent = 'Digite sua cidade.';
      erroDiv.style.display = 'block'; return;
    }
    if (senha.length < 6) {
      erroDiv.textContent = 'A senha deve ter pelo menos 6 caracteres.';
      erroDiv.style.display = 'block'; return;
    }
    if (senha !== senha2) {
      erroDiv.textContent = 'As senhas nÃ£o coincidem.';
      erroDiv.style.display = 'block'; return;
    }

    const btn = document.getElementById('btn-cadastrar');
    UI.btnLoading(btn, true);

    const r = await Api.chamar('solicitarCadastro', {
      nome, telefone: tel, profissao: prof, cidade, senha, observacoes: obs
    });

    UI.btnLoading(btn, false);

    if (!r.sucesso) {
      erroDiv.textContent = r.mensagem || 'Erro ao cadastrar. Tente novamente.';
      erroDiv.style.display = 'block'; return;
    }

    // Mostra card de sucesso
    const primeiroNome = nome.split(' ')[0] || nome;
    document.getElementById('pendente-icon').textContent  = 'âœ…';
    document.getElementById('pendente-titulo').textContent = 'Cadastro Ativo!';
    document.getElementById('pendente-msg').innerHTML =
      'ðŸ—ï¸ <strong>Bem-vindo(a), ' + Api.san(primeiroNome) + '!</strong><br><br>'
      + 'Seu acesso ao ObraFÃ¡cil estÃ¡ liberado.<br><br>'
      + 'VocÃª tem serviÃ§os de <strong>' + Api.san(prof) + '</strong> em <strong>'
      + Api.san(cidade) + '</strong> e jÃ¡ temos oportunidades aguardando!<br><br>'
      + 'ðŸŽ <strong>3 crÃ©ditos de boas-vindas</strong> disponÃ­veis!';

    if (r.senha) {
      const boxAcesso = document.getElementById('pendente-acesso');
      boxAcesso.innerHTML =
        'ðŸ”‘ <strong>Seus dados de acesso:</strong><br>'
        + 'WhatsApp: <strong>' + Api.san(tel) + '</strong><br>'
        + 'Senha: <strong style="font-size:16px;color:#ff8c00">' + Api.san(r.senha) + '</strong><br><br>'
        + 'âš ï¸ Guarde sua senha! VocÃª tambÃ©m a recebeu no WhatsApp.';
      boxAcesso.style.display = 'block';
    }

    const msgWpp = 'OlÃ¡! Acabei de me cadastrar no ObraFÃ¡cil como ' + prof
      + '.\nMeu nome: ' + nome + '.\nWhatsApp: ' + tel + '.\nQuero comeÃ§ar a usar!';
    document.getElementById('wpp-pendente').href =
      'https://wa.me/' + ObraFacil.WA_ADMIN + '?text=' + encodeURIComponent(msgWpp);

    document.getElementById('card-auth').style.display    = 'none';
    document.getElementById('card-pendente').style.display = 'block';
  }

  // â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function sair() {
    _limparTimers();
    Auth.limpar();
    document.getElementById('painel').classList.remove('show');
    document.getElementById('inp-tel').value   = '';
    document.getElementById('inp-senha').value = '';
    mostrarAba('login');
    UI.mostrarTela('tela-selecao');
  }

  // â”€â”€ Iniciar painel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _iniciarPainel(prof) {
    document.getElementById('tela-selecao').style.display = 'none';
    document.getElementById('tela-prof').style.display    = 'none';
    document.getElementById('painel').classList.add('show');
    document.getElementById('bv-nome').textContent =
      'OlÃ¡, ' + Api.san(prof.nome.split(' ')[0]) + '!';
    _atualizarSaldoUI(prof.creditos, prof);
    carregarLeads();
  }

  function _atualizarSaldoUI(creditos, prof) {
    prof = prof || Auth.getProfissional();
    document.getElementById('hd-creditos').textContent = creditos;
    const pill = document.getElementById('saldo-pill');
    const aviso = document.getElementById('aviso-sem-credito');
    const lista = document.getElementById('lista-leads');

    if (creditos <= 0) {
      pill.classList.add('saldo-zero');
      if (aviso) aviso.style.display = 'block';
      if (lista) lista.style.display = 'none';
    } else {
      pill.classList.remove('saldo-zero');
      if (aviso) aviso.style.display = 'none';
      if (lista) lista.style.display = 'block';
    }

    if (prof) {
      document.getElementById('bv-prof').textContent =
        Api.san(prof.profissao) + ' â€” ' + creditos + ' crÃ©ditos disponÃ­veis';
    }
  }

  // â”€â”€ Tabs do painel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function irTab(n) {
    ['tab-leads', 'tab-comprar', 'tab-historico'].forEach((id, i) => {
      document.getElementById(id).style.display = i === n ? 'block' : 'none';
    });
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      b.classList.toggle('on', i === n);
    });
    if (n === 2) carregarHistorico();
  }

  // â”€â”€ Leads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function carregarLeads() {
    const prof = Auth.getProfissional();
    if (!prof || prof.creditos <= 0) return;

    const lista = document.getElementById('lista-leads');
    lista.innerHTML = '<div class="vazio"><div class="vazio-titulo">Buscando leads...</div></div>';

    const r = await Api.chamar('getLeadsDisponiveis', { idProfissional: prof.id });

    if (!r.sucesso) {
      lista.innerHTML = '<div class="vazio">'
        + '<div class="vazio-titulo">Erro ao buscar leads</div>'
        + '<div class="vazio-desc">' + Api.san(r.mensagem) + '</div>'
        + '<br><button class="btn-primario" style="max-width:200px;margin:0 auto" '
        + 'onclick="App.carregarLeads()">Tentar novamente</button></div>';
      return;
    }

    if (!r.leads || !r.leads.length) {
      lista.innerHTML = '<div class="vazio">'
        + '<div class="vazio-icon">ðŸ“­</div>'
        + '<div class="vazio-titulo">Nenhum lead disponÃ­vel agora</div>'
        + '<div class="vazio-desc">Novos leads aparecem aqui assim que entram no sistema.</div></div>';
      return;
    }

    lista.innerHTML = r.leads.map(_renderLead).join('');
    r.leads.forEach(lead => {
      if (lead.deadline && !lead.jaDesbloqueado) {
        _iniciarTimerDeadline(lead.id, lead.deadline);
      }
    });
  }

  function _renderLead(lead) {
    const qtd = lead.qtdJaViram || 0;

    // Lead jÃ¡ desbloqueado com contato
    if (lead.jaDesbloqueado && lead.contato) {
      const c = lead.contato;
      const telLimpo = Api.san(c.Telefone || '').replace(/\D/g, '');
      const wppMsg = 'OlÃ¡ ' + (c.Nome||'') + '! Vi sua solicitaÃ§Ã£o de '
        + (lead.tipoObra||'') + ' pelo ObraFÃ¡cil. Posso te ajudar!';
      return `
        <div class="lead-card desbloqueado" id="card-${Api.san(lead.id)}">
          <div class="lead-topo">
            <div class="lead-tipo">${Api.san(lead.tipoObra)}</div>
            <div class="lead-badges"><span class="badge badge-desb">âœ… Desbloqueado</span></div>
          </div>
          <div class="lead-info">
            <span>ðŸ“ ${Api.san(lead.cidade)}</span>
            <span>ðŸ“… ${Api.san(lead.data)}</span>
          </div>
          ${lead.observacaoResumida ? `<div class="lead-obs">${Api.san(lead.observacaoResumida)}</div>` : ''}
          <div class="lead-contato">
            <div class="contato-item">
              <span class="contato-label">Nome</span>
              <span class="contato-val">${Api.san(c.Nome || 'N/A')}</span>
            </div>
            <div class="contato-item">
              <span class="contato-label">Telefone</span>
              <span class="contato-val">
                <a href="tel:${Api.san(c.Telefone || '')}">${Api.san(c.Telefone || 'N/A')}</a>
              </span>
            </div>
          </div>
          <div class="lead-footer">
            <span class="lead-data">Contato jÃ¡ desbloqueado</span>
            <a class="btn-whatsapp"
               href="https://wa.me/55${telLimpo}?text=${encodeURIComponent(wppMsg)}"
               target="_blank" rel="noopener">Abrir WhatsApp</a>
          </div>
        </div>`;
    }

    // Lead desbloqueado sem contato no payload
    if (lead.jaDesbloqueado) {
      return `
        <div class="lead-card desbloqueado" id="card-${Api.san(lead.id)}">
          <div class="lead-topo">
            <div class="lead-tipo">${Api.san(lead.tipoObra)}</div>
            <div class="lead-badges"><span class="badge badge-desb">âœ… Desbloqueado</span></div>
          </div>
          <div class="lead-footer">
            <span class="lead-data">Ver contato no HistÃ³rico</span>
            <button class="btn-desbloquear" style="background:var(--verde)"
              onclick="App.irTab(2)">Ver no HistÃ³rico</button>
          </div>
        </div>`;
    }

    // Badge de escassez
    let badgeEscassez = '';
    if (qtd === 0)      badgeEscassez = '<span class="badge" style="background:#e0f2fe;color:#0369a1">3 vagas</span>';
    else if (qtd === 1) badgeEscassez = '<span class="badge badge-urgente">âš¡ 2 vagas restantes</span>';
    else if (qtd === 2) badgeEscassez = '<span class="badge badge-quente">ðŸ”¥ ÃšLTIMA VAGA!</span>';

    const timerHtml = lead.deadline
      ? `<span class="deadline-timer" id="timer-${Api.san(lead.id)}">Calculando...</span>` : '';

    let concorrencia = '';
    if (qtd === 1) concorrencia = '<br><span class="concorrencia">1 profissional jÃ¡ desbloqueou</span>';
    else if (qtd === 2) concorrencia = '<br><span class="concorrencia" style="color:var(--vermelho);font-weight:700">2 jÃ¡ desbloquearam â€” Ãºltima vaga!</span>';

    return `
      <div class="lead-card" id="card-${Api.san(lead.id)}">
        <div class="lead-topo">
          <div class="lead-tipo">${Api.san(lead.tipoObra)}</div>
          <div class="lead-badges">
            <span class="badge badge-novo">Novo</span>
            ${badgeEscassez}
          </div>
        </div>
        <div class="lead-info">
          <span>ðŸ“ ${Api.san(lead.cidade)}</span>
          <span>ðŸ“… ${Api.san(lead.data)}</span>
        </div>
        ${lead.observacaoResumida ? `<div class="lead-obs">${Api.san(lead.observacaoResumida)}</div>` : ''}
        <div class="lead-footer">
          <div>${timerHtml}${concorrencia}</div>
          <button class="btn-desbloquear"
            onclick="App.desbloquear('${Api.san(lead.id)}', this)">
            Desbloquear (1 crÃ©dito)
          </button>
        </div>
      </div>`;
  }

  // â”€â”€ Timer de deadline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _iniciarTimerDeadline(idLead, deadlineStr) {
    if (_timersDeadline[idLead]) clearInterval(_timersDeadline[idLead]);
    const deadline = new Date(deadlineStr).getTime();

    function atualizar() {
      const restante = deadline - Date.now();
      const el = document.getElementById('timer-' + idLead);
      if (!el) { clearInterval(_timersDeadline[idLead]); return; }
      if (restante <= 0) {
        clearInterval(_timersDeadline[idLead]);
        delete _timersDeadline[idLead];
        const card = document.getElementById('card-' + idLead);
        if (card) card.style.display = 'none';
        return;
      }
      const m = Math.floor(restante / 60000);
      const s = Math.floor((restante % 60000) / 1000);
      el.textContent = m + 'm ' + String(s).padStart(2, '0') + 's';
      if (restante < 120000) el.classList.add('urgente');
    }

    atualizar();
    _timersDeadline[idLead] = setInterval(atualizar, 1000);
  }

  // â”€â”€ Desbloquear lead â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function desbloquear(idLead, btn) {
    const prof = Auth.getProfissional();
    if (!prof || prof.creditos <= 0) {
      UI.abrirModal('modal-sem-cred'); return;
    }

    UI.btnLoading(btn, true);

    const r = await Api.chamar('desbloquearLead', {
      idProfissional: prof.id,
      idLead
    });

    UI.btnLoading(btn, false);

    if (!r.sucesso) {
      if (r.semCredito) { UI.abrirModal('modal-sem-cred'); return; }
      if (r.esgotado) {
        const card = document.getElementById('card-' + idLead);
        if (card) {
          card.innerHTML = '<div style="padding:12px;text-align:center;color:var(--vermelho);font-size:13px;font-weight:600">'
            + 'ðŸ”´ Este lead foi esgotado. Verifique outros leads.</div>';
          setTimeout(() => { if (card) card.style.display = 'none'; }, 3000);
        }
        UI.toast('Lead esgotado! Outro profissional chegou primeiro.', 'info');
        return;
      }
      UI.toast(r.mensagem || 'Erro ao desbloquear.', 'erro');
      return;
    }

    UI.toast(r.mensagem || 'Lead desbloqueado!', 'sucesso');
    Auth.atualizarCreditos(r.creditosRestantes);
    _atualizarSaldoUI(r.creditosRestantes);
    _preencherContato(idLead, r.lead);

    if (_timersDeadline[idLead]) {
      clearInterval(_timersDeadline[idLead]);
      delete _timersDeadline[idLead];
    }
  }

  function _preencherContato(idLead, lead) {
    const card = document.getElementById('card-' + idLead);
    if (!card || !lead) return;
    const telLimpo = Api.san(lead.Telefone || '').replace(/\D/g, '');
    const wppMsg = 'OlÃ¡ ' + (lead.Nome||'') + '! Vi sua solicitaÃ§Ã£o de '
      + (lead.Tipo_Obra||'') + ' pelo ObraFÃ¡cil. Posso te ajudar!';
    card.classList.add('desbloqueado');
    card.innerHTML = `
      <div class="lead-topo">
        <div class="lead-tipo">${Api.san(lead.Tipo_Obra)}</div>
        <div class="lead-badges"><span class="badge badge-desb">Desbloqueado</span></div>
      </div>
      <div class="lead-info">
        <span>ðŸ“ ${Api.san(lead.Cidade || '')}</span>
        <span>ðŸ“… ${Api.san(lead.Data_Entrada || '')}</span>
      </div>
      ${lead.Observacoes ? `<div class="lead-obs">${Api.san(lead.Observacoes)}</div>` : ''}
      <div class="lead-contato">
        <div class="contato-item">
          <span class="contato-label">Nome</span>
          <span class="contato-val">${Api.san(lead.Nome || 'N/A')}</span>
        </div>
        <div class="contato-item">
          <span class="contato-label">Telefone</span>
          <span class="contato-val">
            <a href="tel:${Api.san(lead.Telefone || '')}">${Api.san(lead.Telefone || 'N/A')}</a>
          </span>
        </div>
      </div>
      <div class="lead-footer">
        <span class="lead-data">Contato desbloqueado</span>
        <a class="btn-whatsapp"
           href="https://wa.me/55${telLimpo}?text=${encodeURIComponent(wppMsg)}"
           target="_blank" rel="noopener">Abrir WhatsApp</a>
      </div>`;
  }

  // â”€â”€ Pacotes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function selecionarPacote(creditos, valor, el) {
    document.querySelectorAll('.pacote').forEach(p => p.style.borderColor = '');
    el.style.borderColor = 'var(--laranja)';
    const prof = Auth.getProfissional();
    document.getElementById('pix-detalhe').textContent =
      creditos + ' crÃ©ditos por R$ ' + valor + ' â€” envie exatamente R$ ' + valor + ',00';
    const wppMsg = 'OlÃ¡! Quero comprar o pacote de ' + creditos + ' crÃ©ditos por R$ ' + valor
      + '. Meu cadastro: ' + (prof ? prof.nome + ' (' + prof.id + ')' : '') + '. Segue o comprovante:';
    document.getElementById('pix-wpp').href =
      'https://wa.me/' + ObraFacil.WA_ADMIN + '?text=' + encodeURIComponent(wppMsg);
    const box = document.getElementById('pix-box');
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth' });
  }

  // â”€â”€ HistÃ³rico â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function carregarHistorico() {
    const prof = Auth.getProfissional();
    if (!prof) return;
    const lista = document.getElementById('lista-historico');
    lista.innerHTML = '<div class="vazio"><div class="vazio-titulo">Buscando...</div></div>';

    const r = await Api.chamar('getHistoricoDesb', { idProfissional: prof.id });

    if (!r.sucesso || !r.historico || !r.historico.length) {
      lista.innerHTML = '<div class="vazio">'
        + '<div class="vazio-titulo">Nenhum lead desbloqueado ainda</div>'
        + '<div class="vazio-desc">Quando vocÃª desbloquear um lead, ele aparecerÃ¡ aqui.</div></div>';
      return;
    }

    lista.innerHTML = r.historico.map(h => `
      <div class="hist-item">
        <div class="hist-info">
          <strong>${Api.san(h.tipoObra)} â€” ${Api.san(h.cidade)}</strong>
          <span>${Api.san(h.nome)} | ${Api.san(h.telefone)}</span>
        </div>
        <div class="hist-data">${Api.san(h.data)}</div>
      </div>`).join('');
  }

  // â”€â”€ InicializaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function init() {
    // Registra service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(e => {
        console.warn('[SW] Falha ao registrar:', e.message);
      });
    }

    // Inicia banner offline
    UI.initOfflineBanner();

    // Eventos do formulÃ¡rio
    document.getElementById('form-lead')
      .addEventListener('submit', enviarLead);

    // Verifica sessÃ£o existente
    const sessao = Auth.carregar();

    if (sessao && sessao.id) {
      // Atualiza saldo antes de mostrar o painel
      const r = await Api.chamar('getSaldoCreditos', { idProfissional: sessao.id });
      if (r.sucesso) {
        sessao.creditos = r.creditos;
        Auth.salvar(sessao);
      }
      _esconderLoading();
      _iniciarPainel(sessao);
    } else {
      _esconderLoading();
      UI.mostrarTela('tela-selecao');
    }
  }

  function _esconderLoading() {
    const loading = document.getElementById('loading-inicial');
    if (!loading) return;
    loading.classList.add('saindo');
    setTimeout(() => loading.style.display = 'none', 400);
  }

  // ExpÃµe apenas o necessÃ¡rio para o HTML
  return {
    irParaCliente, irParaProfissional, voltarSelecao,
    selecionarMaterial, mostrarAba,
    entrar, cadastrar, sair,
    irTab, carregarLeads, desbloquear,
    selecionarPacote, carregarHistorico,
    init
  };

})();

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', App.init);
