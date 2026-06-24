/* =====================================================================
   ADMIN.JS — Painel de controle da Rede de Proteção
   Edita os dados públicos, gerencia fotos e valida os pedidos de
   atualização enviados pelo público através do Proxy Cloudflare.
   ===================================================================== */
(function () {
  "use strict";
  var E = Store.esc, C = window.CONFIG || {};

  var EIXO_LABEL = {
    social: "Assistência Social", saude: "Saúde", edu: "Educação",
    ct: "Conselho Tutelar", just: "Sistema de Justiça"
  };
  var CAMPO_LABEL = {
    endereco: "Endereço", telefone: "Telefone", whatsapp: "WhatsApp",
    email: "E-mail"
  };

  var catalogo = null, caixa = null, abaAtual = "inst";

  /* ---------------- toast ---------------- */
  var toastT;
  function toast(msg, bad) {
    var t = document.getElementById("toast"); t.textContent = msg;
    t.className = bad ? "show bad" : "show";
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = ""; }, 2600);
  }

  /* ---------------- login ---------------- */
  function entrar() {
    var v = document.getElementById("senha").value.trim();
    if (!C.ADMIN_SENHA || C.ADMIN_SENHA === "trocar-esta-senha") {
      toast("Defina a senha em config.js antes de usar.", true); return;
    }
    if (v === C.ADMIN_SENHA) {
      sessionStorage.setItem("rede_admin", "1");
      mostrarPainel();
    } else {
      var m = document.getElementById("gate-msg"); 
      m.textContent = "Senha incorreta."; 
      m.style.display = "block";
    }
  }
  
  function sair() { 
    sessionStorage.removeItem("rede_admin"); 
    location.reload(); 
  }

  /* ---------------- carregamento ---------------- */
  async function mostrarPainel() {
    // Verifica se está logado (senha visual)
    if (sessionStorage.getItem("rede_admin") !== "1") return;

    document.getElementById("gate").style.display = "none";
    document.getElementById("painel").style.display = "block";
    document.getElementById("admin-top-actions").style.display = "flex";

    try {
      // O Store.js agora cuida de ir ao Proxy (que tem o Token)
      catalogo = await Store.getCatalogo();
      caixa = await Store.getCaixa();
      
      if (!caixa || !Array.isArray(caixa.pedidos)) caixa = { pedidos: [] };
      
      atualizarMedidor(); 
      renderAbas(); 
      render();
    } catch (e) {
      console.error(e);
      document.getElementById("painel").innerHTML =
        '<div class="empty-state"><div class="big">⚠️</div>Não foi possível carregar os dados via Proxy.<br>' +
        'Verifique a conexão e o config.js.<br><span style="font-size:12px;opacity:.7">' + E(e.message || e) + '</span></div>';
    }
  }

  function atualizarMedidor() {
    var kb = Store.tamanhoKB(catalogo);
    var m = document.getElementById("meter");
    if (!m) return;
    m.innerHTML = "Tamanho do catálogo: <b>" + kb + " KB</b>";
    m.className = kb > 180 ? "meter high" : "meter";
    m.title = kb > 180 ? "Catálogo grande — prefira fotos por URL a fotos enviadas." : "";
  }

  /* ---------------- abas ---------------- */
  function renderAbas() {
    var pend = (caixa.pedidos || []).filter(function (p) { return p.status === "pendente"; }).length;
    var nav = document.getElementById("tabs");
    nav.innerHTML =
      '<button class="tab' + (abaAtual === "inst" ? " active" : "") + '" data-aba="inst">Instituições</button>' +
      '<button class="tab' + (abaAtual === "ped" ? " active" : "") + '" data-aba="ped">Pedidos pendentes' +
      (pend ? '<span class="pill">' + pend + '</span>' : '') + '</button>';
    
    Array.prototype.forEach.call(nav.querySelectorAll(".tab"), function (b) {
      b.onclick = function () { abaAtual = b.getAttribute("data-aba"); renderAbas(); render(); };
    });
  }

  function render() { if (abaAtual === "inst") renderInstituicoes(); else renderPedidos(); }

  /* =====================================================================
     ABA 1 — INSTITUIÇÕES
     ===================================================================== */
  function renderInstituicoes() {
    var wrap = document.getElementById("conteudo");
    var insts = (catalogo.instituicoes || []).slice().sort(function (a, b) {
      return a.eixo === b.eixo ? (a.ordem || 0) - (b.ordem || 0) : a.eixo.localeCompare(b.eixo);
    });
    var html = '<div class="toolbar-admin">' +
      '<button class="mini" id="add-inst">+ Adicionar instituição</button>' +
      '<button class="mini" id="exportar">Exportar (backup)</button>' +
      '<button class="mini" id="importar">Importar</button>' +
      '<span class="meter" id="meter"></span></div>';
    html += '<div class="cards-grid">' + insts.map(cardEditor).join("") + '</div>';
    wrap.innerHTML = html;
    atualizarMedidor();

    document.getElementById("add-inst").onclick = adicionarInstituicao;
    document.getElementById("exportar").onclick = exportar;
    document.getElementById("importar").onclick = importar;

    insts.forEach(function (inst) { ligarCard(inst.id); });
  }

  function cardEditor(inst) {
    var v = function (s) { return E(s || ""); };
    var thumb = inst.foto
      ? '<div class="thumb" id="thumb-' + inst.id + '" style="background-image:url(\'' + String(inst.foto).replace(/'/g, "") + '\')"></div>'
      : '<div class="thumb" id="thumb-' + inst.id + '">sem foto</div>';
    return '<div class="ecard" style="--ac:var(--c-' + inst.eixo + ')" data-id="' + inst.id + '">' +
      '<div class="ecard-head"><div class="eixo-nome">' + E(EIXO_LABEL[inst.eixo] || inst.eixo) + '</div>' +
      '<div class="kicker">' + v(inst.kicker) + '</div>' +
      '<h3>' + v(inst.nome) + '</h3></div>' +
      '<div class="ecard-body">' +
      thumb +
      '<div class="photo-actions">' +
      '<button class="mini" data-act="foto-arq" data-id="' + inst.id + '">Enviar imagem</button>' +
      '<button class="mini" data-act="foto-url" data-id="' + inst.id + '">Colar URL</button>' +
      '<button class="mini danger" data-act="foto-del" data-id="' + inst.id + '">Remover foto</button>' +
      '<input type="file" accept="image/*" style="display:none" id="file-' + inst.id + '">' +
      '</div>' +
      campo(inst.id, "nome", "Nome", inst.nome) +
      campo(inst.id, "sub", "Subtítulo", inst.sub) +
      campo(inst.id, "kicker", "Categoria (kicker)", inst.kicker) +
      campo(inst.id, "endereco", "Endereço", inst.endereco) +
      '<div class="field-row">' +
      campo(inst.id, "telefone", "Telefone", inst.telefone) +
      campo(inst.id, "whatsapp", "WhatsApp", inst.whatsapp) +
      '</div>' +
      campo(inst.id, "email", "E-mail", inst.email) +
      campoArea(inst.id, "desc", "Descrição (aceita <b>negrito</b>)", inst.desc) +
      '<div class="save-row">' +
      '<button class="btn-save" data-act="salvar" data-id="' + inst.id + '">Salvar</button>' +
      '<span class="saved-tag" id="saved-' + inst.id + '">salvo ✓</span>' +
      '<button class="mini danger" data-act="excluir" data-id="' + inst.id + '" title="Excluir instituição">🗑</button>' +
      '</div>' +
      '</div></div>';
  }

  function campo(id, k, label, val) {
    return '<div class="field"><label for="' + id + '-' + k + '">' + label + '</label>' +
      '<input id="' + id + '-' + k + '" type="text" value="' + E(val || "") + '"></div>';
  }
  function campoArea(id, k, label, val) {
    return '<div class="field"><label for="' + id + '-' + k + '">' + label + '</label>' +
      '<textarea id="' + id + '-' + k + '">' + E(val || "") + '</textarea></div>';
  }

  function getInst(id) { return (catalogo.instituicoes || []).find(function (i) { return i.id === id; }); }

  function ligarCard(id) {
    var card = document.querySelector('.ecard[data-id="' + id + '"]'); if (!card) return;
    Array.prototype.forEach.call(card.querySelectorAll("[data-act]"), function (b) {
      var act = b.getAttribute("data-act");
      b.onclick = function () {
        if (act === "salvar") salvarCard(id);
        else if (act === "excluir") excluirInstituicao(id);
        else if (act === "foto-arq") document.getElementById("file-" + id).click();
        else if (act === "foto-url") colarUrl(id);
        else if (act === "foto-del") removerFoto(id);
      };
    });
    var file = document.getElementById("file-" + id);
    if (file) file.onchange = function () { if (file.files && file.files[0]) enviarImagem(id, file.files[0]); };
  }

  async function salvarCard(id) {
    var o = getInst(id); if (!o) return;
    ["nome", "sub", "kicker", "endereco", "telefone", "email", "whatsapp", "desc"].forEach(function (k) {
      var el = document.getElementById(id + "-" + k); if (el) o[k] = el.value.trim();
    });
    var btn = document.querySelector('[data-act="salvar"][data-id="' + id + '"]');
    btn.disabled = true; btn.textContent = "Salvando…";
    try {
      await Store.putCatalogo(catalogo);
      var tag = document.getElementById("saved-" + id); tag.classList.add("show");
      setTimeout(function () { tag.classList.remove("show"); }, 1800);
      atualizarMedidor(); toast("Dados de " + o.nome + " salvos.");
    } catch (e) { toast("Falha ao salvar. Tente novamente.", true); }
    finally { btn.disabled = false; btn.textContent = "Salvar"; }
  }

  function setThumb(id, val) {
    var t = document.getElementById("thumb-" + id);
    if (val) { t.style.backgroundImage = "url('" + String(val).replace(/'/g, "") + "')"; t.textContent = ""; }
    else { t.style.backgroundImage = ""; t.textContent = "sem foto"; }
  }

  async function enviarImagem(id, file) {
    var o = getInst(id); if (!o) return;
    toast("Otimizando imagem…");
    try {
      var dataUri = await Store.comprimirImagem(file, 1000, 0.72);
      o.foto = dataUri; setThumb(id, dataUri);
      await Store.putCatalogo(catalogo); atualizarMedidor();
      toast("Foto atualizada e salva.");
    } catch (e) { toast("Não foi possível processar a imagem.", true); }
  }

  async function colarUrl(id) {
    var o = getInst(id); if (!o) return;
    var url = prompt("Cole o endereço (URL) público da imagem:", o.foto && o.foto.indexOf("http") === 0 ? o.foto : "https://");
    if (url == null) return; url = url.trim();
    o.foto = url; setThumb(id, url);
    try { await Store.putCatalogo(catalogo); atualizarMedidor(); toast("Foto (URL) salva."); }
    catch (e) { toast("Falha ao salvar.", true); }
  }

  async function removerFoto(id) {
    var o = getInst(id); if (!o) return;
    o.foto = ""; setThumb(id, "");
    try { await Store.putCatalogo(catalogo); atualizarMedidor(); toast("Foto removida."); }
    catch (e) { toast("Falha ao salvar.", true); }
  }

  async function adicionarInstituicao() {
    var nome = prompt("Nome da nova instituição:"); if (!nome) return;
    var eixo = prompt("Eixo (social, saude, edu, ct, just):", "social");
    if (!eixo || !EIXO_LABEL[eixo]) { toast("Eixo inválido.", true); return; }
    var maxOrdem = 0;
    (catalogo.instituicoes || []).forEach(function (i) { if (i.eixo === eixo) maxOrdem = Math.max(maxOrdem, i.ordem || 0); });
    var novo = {
      id: Store.idUnico("inst"), eixo: eixo, ordem: maxOrdem + 1,
      rh: EIXO_LABEL[eixo], kicker: "", nome: nome.trim(), sub: "", desc: "",
      endereco: "", telefone: "", whatsapp: "", email: "", foto: ""
    };
    catalogo.instituicoes.push(novo);
    try { await Store.putCatalogo(catalogo); toast("Instituição adicionada."); render(); }
    catch (e) { toast("Falha ao salvar.", true); }
  }

  async function excluirInstituicao(id) {
    var o = getInst(id); if (!o) return;
    if (!confirm('Excluir "' + o.nome + '" do guia? Esta ação não pode ser desfeita.')) return;
    catalogo.instituicoes = catalogo.instituicoes.filter(function (i) { return i.id !== id; });
    try { await Store.putCatalogo(catalogo); toast("Instituição excluída."); render(); }
    catch (e) { toast("Falha ao salvar.", true); }
  }

  /* ---------------- backup ---------------- */
  function exportar() {
    var blob = new Blob([JSON.stringify(catalogo, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "catalogo-rede-protecao-" + Store.hoje() + ".json";
    a.click(); URL.revokeObjectURL(a.href);
    toast("Backup baixado.");
  }
  
  function importar() {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = async function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj || !Array.isArray(obj.instituicoes)) throw new Error("Arquivo sem 'instituicoes'.");
          if (!confirm("Substituir o catálogo atual pelo conteúdo deste arquivo?")) return;
          catalogo = obj; await Store.putCatalogo(catalogo); toast("Catálogo importado."); render();
        } catch (e) { toast("Arquivo inválido: " + (e.message || e), true); }
      };
      r.readAsText(f);
    };
    inp.click();
  }

  /* =====================================================================
     ABA 2 — PEDIDOS PENDENTES
     ===================================================================== */
  function renderPedidos() {
    var wrap = document.getElementById("conteudo");
    var pend = (caixa.pedidos || []).filter(function (p) { return p.status === "pendente"; });
    if (pend.length === 0) {
      wrap.innerHTML = '<div class="empty-state"><div class="big">✓</div>Nenhum pedido pendente.<br>' +
        'Quando alguém enviar uma correção pelo formulário, ela aparece aqui para validação.</div>';
      return;
    }
    wrap.innerHTML = pend.map(reqCard).join("");
    pend.forEach(function (p) {
      var c = document.querySelector('.req[data-id="' + p.id + '"]'); if (!c) return;
      c.querySelector('[data-act="aplicar"]').onclick = function () { aplicar(p.id); };
      c.querySelector('[data-act="rejeitar"]').onclick = function () { rejeitar(p.id); };
    });
  }

  function reqCard(p) {
    var o = getInst(p.instituicaoId) || {};
    var quando = "";
    try { quando = new Date(p.criadoEm).toLocaleString("pt-BR"); } catch (e) { quando = p.criadoEm; }
    var diff = Object.keys(p.campos || {}).map(function (k) {
      var atual = o[k] || "(vazio)";
      return '<div class="diff-row"><span class="k">' + (CAMPO_LABEL[k] || k) + '</span>' +
        '<span class="old">' + E(atual) + '</span><span class="arrow">→</span>' +
        '<span class="new">' + E(p.campos[k]) + '</span></div>';
    }).join("");
    var obs = p.observacao ? '<div class="req-obs">“' + E(p.observacao) + '”</div>' : "";
    var autor = (p.autorNome || p.autorContato)
      ? '<div class="req-meta">Enviado por: ' + E(p.autorNome || "—") + (p.autorContato ? (" · " + E(p.autorContato)) : "") + '</div>'
      : '<div class="req-meta">Enviado anonimamente</div>';
    return '<div class="req" data-id="' + p.id + '">' +
      '<div class="req-head"><h3>' + E(p.instituicaoNome || o.nome || p.instituicaoId) + '</h3>' +
      '<span class="when">' + E(quando) + '</span></div>' +
      autor +
      (diff ? '<div class="diff">' + diff + '</div>' : '<div class="req-meta">Sem campos — apenas observação.</div>') +
      obs +
      '<div class="req-actions">' +
      '<button class="btn-aplicar" data-act="aplicar">Aplicar e publicar</button>' +
      '<button class="btn-rejeitar" data-act="rejeitar">Rejeitar</button>' +
      '</div></div>';
  }

  async function aplicar(reqId) {
    var p = (caixa.pedidos || []).find(function (x) { return x.id === reqId; }); if (!p) return;
    var o = getInst(p.instituicaoId);
    if (!o) { toast("A instituição deste pedido não existe mais.", true); return resolver(reqId); }
    
    // Aplica as mudanças no objeto local
    Object.keys(p.campos || {}).forEach(function (k) { o[k] = p.campos[k]; });
    
    try {
      await Store.putCatalogo(catalogo);     // Salva catálogo via Proxy
      await resolver(reqId);                 // Remove da caixa de entrada
      atualizarMedidor(); 
      renderAbas(); 
      render();
      toast("Atualização publicada em " + o.nome + ".");
    } catch (e) { toast("Falha ao publicar. Tente novamente.", true); }
  }

  async function rejeitar(reqId) {
    if (!confirm("Rejeitar e descartar este pedido?")) return;
    try { 
      await resolver(reqId); 
      renderAbas(); 
      render(); 
      toast("Pedido rejeitado."); 
    } catch (e) { toast("Falha ao atualizar a caixa.", true); }
  }

  /* remove o pedido da caixa de entrada */
  async function resolver(reqId) {
    caixa.pedidos = (caixa.pedidos || []).filter(function (x) { return x.id !== reqId; });
    await Store.putCaixa(caixa); // Salva caixa via Proxy
  }

  /* =====================================================================
     INICIALIZAÇÃO
     ===================================================================== */
  function iniciar() {
    document.getElementById("entrar").onclick = entrar;
    document.getElementById("senha").addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(); });
    var sairBtn = document.getElementById("sair"); if (sairBtn) sairBtn.onclick = sair;
    var atualizarBtn = document.getElementById("recarregar"); if (atualizarBtn) atualizarBtn.onclick = mostrarPainel;
    
    if (sessionStorage.getItem("rede_admin") === "1") mostrarPainel();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
