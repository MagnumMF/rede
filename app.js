/* =====================================================================
   APP.JS — WebApp do Guia da Rede de Proteção
   Carrega os dados do catálogo (JSONBlob), monta o flipbook e controla
   o formulário público de atualização.
   ===================================================================== */
(function () {
  "use strict";
  var E = Store.esc;
  var C = window.CONFIG || {};

  /* ---------------- ícones (do esboço original) ---------------- */
  var I = {
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.7 12.3l-.3.5.7 2.5-2.6-.7-.5.3A8 8 0 1 1 12 4zm-3.4 4c-.2 0-.5 0-.7.4-.3.4-.9 1-.9 2.3s1 2.7 1.1 2.9c.1.2 1.9 3 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.6.8c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2.2-1.6-.3-.4-.5-.8-.6-1-.1-.2 0-.3.1-.4l.4-.5c.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4z"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    bld:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01"/></svg>'
  };

  /* ---------------- configuração dos eixos ---------------- */
  var EIXOS = [
    { id:"social", n:1, kicker:"SUAS", titulo:"Assistência Social",
      body:"A porta de entrada para famílias em situação de vulnerabilidade e a referência quando direitos já foram violados.",
      units:["Sec. de Assistência Social","CRAS","CREAS","Acolhimento"] },
    { id:"saude", n:2, kicker:"SUS", titulo:"Saúde",
      body:"Do cuidado no território à saúde mental: a saúde é, muitas vezes, a primeira a perceber sinais de risco.",
      units:["Sec. de Saúde","UBS / ACS","CAPS"] },
    { id:"edu", n:3, kicker:"Educação", titulo:"Educação",
      body:"A escola e a creche convivem diariamente com a criança — espaço privilegiado para identificar e comunicar precocemente.",
      units:["Sec. Municipal","GERED","Escolas","Creches (CEIs)"] },
    { id:"ct", n:4, kicker:"Direitos", titulo:"Conselho Tutelar",
      body:"O órgão que recebe as denúncias, aplica medidas de proteção e costura o trabalho de toda a rede.",
      units:["Atendimento","Medidas de Proteção","Plantão"] },
    { id:"just", n:5, kicker:"SGD", titulo:"Sistema de Justiça",
      body:"Quando a proteção exige decisão judicial ou fiscalização: o eixo de defesa e responsabilização.",
      units:["Ministério Público","Vara da Infância"] }
  ];

  /* ---------------- helpers ---------------- */
  function has(v){ return v != null && String(v).trim() !== ""; }
  function soDigitos(s){ return String(s||"").replace(/\D/g,""); }
  function cssUrl(s){ return String(s||"").replace(/["'()\\\n\r]/g,""); }
  function fill(n){ var out=""; for(var i=0;i<(n||14);i++) out+="&nbsp;"; return '<span class="fill">'+out+"</span>"; }

  /* ---------------- páginas dinâmicas ---------------- */
  function divider(eixo){
    return '<div class="pg divider" style="--ac:var(--c-'+eixo.id+');--ac-d:var(--c-'+eixo.id+'-d)">'+
      '<div class="dk">Eixo '+eixo.n+'</div>'+
      '<div class="dn">0'+eixo.n+'</div>'+
      '<div class="dk" style="margin:0 0 4px">'+E(eixo.kicker)+'</div>'+
      '<h2>'+E(eixo.titulo)+'</h2>'+
      '<p>'+E(eixo.body)+'</p>'+
      '<div class="units">'+eixo.units.map(function(u){return '<span>'+E(u)+'</span>';}).join("")+'</div>'+
    '</div>';
  }

  function card(o){
    var eixo = o.eixo;

    // Renderiza um ou mais telefones (separados por ; ou ·) como links tel:.
    function telField(v){
      return String(v).split(/[;·]/).map(function(s){ return s.trim(); })
        .filter(Boolean)
        .map(function(n){ return '<a href="tel:'+E(soDigitos(n))+'">'+E(n)+'</a>'; })
        .join(" · ");
    }
    function crow(icon, inner){
      return '<div class="crow">'+icon+'<div>'+inner+'</div></div>';
    }

    // Só mostra as linhas de contato que existem (instituições podem ter
    // apenas o nome, sem endereço/telefone/WhatsApp/e-mail).
    var rows = [];
    if(has(o.endereco)) rows.push(crow(I.pin, '<span class="val">'+E(o.endereco)+'</span>'));
    if(has(o.telefone)) rows.push(crow(I.phone, '<span class="lbl">Tel.</span> '+telField(o.telefone)));
    if(has(o.whatsapp)) rows.push(crow(I.wa, '<span class="lbl">WhatsApp</span> <a href="https://wa.me/55'+soDigitos(o.whatsapp)+'" target="_blank" rel="noopener">'+E(o.whatsapp)+'</a>'));
    if(has(o.email))    rows.push(crow(I.mail, '<a href="mailto:'+E(o.email)+'">'+E(o.email)+'</a>'));
    var contactsHtml = rows.length ? '<div class="contacts">'+rows.join("")+'</div>' : '';

    var photo = has(o.foto)
      ? '<div class="photo has-img" style="background-image:url(\''+cssUrl(o.foto)+'\')"></div>'
      : '<div class="photo">'+I.bld+'<span>Foto da sede</span></div>';
    return '<div class="pg" style="--ac:var(--c-'+eixo+');--ac-d:var(--c-'+eixo+'-d)">'+
      '<div class="eixo-tab"></div>'+
      '<div class="rh">'+E(o.rh)+'</div>'+
      '<div class="kicker">'+E(o.kicker)+'</div>'+
      '<h2 class="card-t">'+E(o.nome)+'</h2>'+
      '<div class="sub-t">'+E(o.sub)+'</div>'+
      photo+
      contactsHtml+
      '<div class="desc">'+(o.desc||"")+'</div>'+
    '</div>';
  }

  function paginaCapa(meta){
    return '<div class="pg cover">'+
      '<div class="ct-k">Cartilha · '+(new Date().getFullYear())+'</div>'+
      '<div class="crest"><svg width="92" height="92" viewBox="0 0 100 100">'+
        '<circle cx="50" cy="50" r="44" fill="none" stroke="#a9d8cf" stroke-width="1.5" stroke-dasharray="2 4" opacity=".7"/>'+
        '<path d="M50 24c-7 0-12 9-12 18 0 6 3 11 7 13-9 2-16 9-16 19h42c0-10-7-17-16-19 4-2 7-7 7-13 0-9-5-18-12-18z" fill="#f0c986"/>'+
        '<path d="M50 70c14 0 24 9 24 9V62c0-13-11-22-24-22S26 49 26 62v17s10-9 24-9z" fill="none" stroke="#f0c986" stroke-width="2" opacity=".55"/>'+
      '</svg></div>'+
      '<div><h1>Guia da Rede<em>de Proteção</em></h1><div class="line"></div>'+
        '<div class="place">Integral à Infância e à Adolescência</div>'+
        '<div class="comarca">Município de '+E(meta.municipio||"São Joaquim · SC")+'</div></div>'+
      '<div class="foot">Quem é quem · Onde encontrar · Como acionar</div>'+
    '</div>';
  }

  function paginaApresentacao(){
    return '<div class="pg prose">'+
      '<div class="rh">Apresentação</div>'+
      '<h2>Uma rede que se conhece protege melhor</h2>'+
      '<p>Proteger uma criança raramente é tarefa de um só órgão. A <b>proteção integral</b> só acontece quando saúde, educação, assistência social, Conselho Tutelar e sistema de justiça atuam de forma articulada.</p>'+
      '<p>Na prática, porém, a comunicação entre esses pontos esbarra na <b>rotatividade das equipes</b> e na falta de um cadastro atualizado de quem faz o quê e como falar com cada serviço.</p>'+
      '<p>Este guia reúne, em um só lugar, <b>os componentes da rede</b>, seus endereços e contatos — para que ninguém perca tempo procurando a porta certa quando uma criança precisa.</p>'+
      '<div class="sign">— Rede de Proteção · Comarca de São Joaquim</div>'+
    '</div>';
  }

  function paginaSumario(toc){
    var cores = { social:"--c-social", saude:"--c-saude", edu:"--c-edu", ct:"--c-ct", just:"--c-just", denuncia:"--c-just-d", update:"--c-edu" };
    var lis = toc.map(function(t){
      var pp = String(t.pagina).padStart(2,"0");
      return '<li><span class="dot" style="--cc:var('+(cores[t.cor]||"--c-base")+')"></span>'+
        '<span class="nm">'+E(t.nome)+'</span><span class="pp"><b>'+pp+'</b></span></li>';
    }).join("");
    return '<div class="pg toc"><div class="rh">Sumário</div>'+
      '<h2>O que você encontra aqui</h2><ul>'+lis+'</ul></div>';
  }

  function paginaCanais(){
    return '<div class="pg channels"><div class="eixo-tab" style="background:var(--c-just)"></div>'+
      '<div class="rh">Em caso de violência</div><h2>Canais para acionar a rede</h2>'+
      '<div class="chan"><div class="big">100</div><div class="t"><b>Disque Direitos Humanos</b><span>Denúncia de violações contra crianças e adolescentes · 24h, anônimo e gratuito.</span></div></div>'+
      '<div class="chan"><div class="big">190</div><div class="t"><b>Polícia Militar</b><span>Situações de emergência e flagrante.</span></div></div>'+
      '<div class="chan"><div class="big">192</div><div class="t"><b>SAMU</b><span>Urgência e emergência em saúde.</span></div></div>'+
      '<div class="chan"><div class="big">CT</div><div class="t"><b>Conselho Tutelar</b><span>Telefone e plantão na página do Conselho Tutelar.</span></div></div>'+
    '</div>';
  }

  function paginaAtualizacao(){
    var appUrl = C.APP_URL || (location.origin + location.pathname);
    var qr = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=" + encodeURIComponent(appUrl);
    var urlMostrar = appUrl.replace(/^https?:\/\//,"");
    return '<div class="pg update"><div class="rh">Mantenha vivo</div>'+
      '<h2>Os dados mudaram?<br>Atualize aqui</h2>'+
      '<p>Equipes mudam, telefones trocam. Aponte a câmera para o QR ou toque no botão e envie a correção. As informações alimentam a redivulgação anual deste guia.</p>'+
      '<div class="qr"><img alt="QR para o formulário de atualização" src="'+qr+'" onerror="this.style.display=\'none\'"></div>'+
      '<div class="url">'+E(urlMostrar)+'</div>'+
      '<button class="btn-update" type="button" data-open-form>Atualizar dados agora</button>'+
      '<div class="cycle">Revisão e redivulgação · anual</div>'+
    '</div>';
  }

  function paginaContracapa(){
    return '<div class="pg backcover">'+
      '<svg width="40" height="40" viewBox="0 0 100 100"><path d="M50 24c-7 0-12 9-12 18 0 6 3 11 7 13-9 2-16 9-16 19h42c0-10-7-17-16-19 4-2 7-7 7-13 0-9-5-18-12-18z" fill="#f0c986" opacity=".85"/></svg>'+
      '<h3>“É dever de todos<br>prevenir a ocorrência<br>de ameaça ou violação<br>dos direitos da criança.”</h3>'+
      '<p>Estatuto da Criança e do Adolescente · Lei nº 8.069/1990, art. 70</p>'+
      '<div class="tiny">Rede de Proteção · Comarca de São Joaquim · SC</div>'+
    '</div>';
  }

  /* ---------------- montagem da sequência de páginas ---------------- */
  function montar(catalogo){
    var meta = catalogo.meta || {};
    var insts = (catalogo.instituicoes || []).slice();
    var pages = [], toc = [];

    pages.push(paginaCapa(meta));
    pages.push(paginaApresentacao());
    var idxSumario = pages.length; pages.push("");   // reservado, preenchido depois

    EIXOS.forEach(function(eixo){
      toc.push({ nome:eixo.titulo, cor:eixo.id, pagina: pages.length + 1 });
      pages.push(divider(eixo));
      insts.filter(function(i){ return i.eixo === eixo.id; })
           .sort(function(a,b){ return (a.ordem||0)-(b.ordem||0); })
           .forEach(function(i){ pages.push(card(i)); });
    });

    toc.push({ nome:"Canais de denúncia", cor:"denuncia", pagina: pages.length + 1 });
    pages.push(paginaCanais());
    toc.push({ nome:"Atualize os dados", cor:"update", pagina: pages.length + 1 });
    pages.push(paginaAtualizacao());
    pages.push(paginaContracapa());

    pages[idxSumario] = paginaSumario(toc);
    return pages;
  }

  /* =====================================================================
     MECÂNICA DO LIVRO (preservada do esboço original)
     ===================================================================== */
  var book, papers, N, numPapers, current = 1, max;

  function construir(pages){
    book = document.getElementById("book");
    book.innerHTML = "";
    if (pages.length % 2 !== 0) pages.push('<div class="pg" style="background:var(--paper-2)"></div>');
    N = pages.length; numPapers = N/2; papers = [];
    for (var i=0;i<numPapers;i++){
      var fI=2*i, bI=2*i+1, fNum=fI+1, bNum=bI+1;
      var paper=document.createElement("div"); paper.className="paper";
      paper.innerHTML =
        '<div class="face front">'+pages[fI]+'<div class="pgnum r">'+(fNum>1&&fNum<N?"· "+fNum+" ·":"")+'</div></div>'+
        '<div class="face back">'+pages[bI]+'<div class="pgnum l">'+(bNum<N?"· "+bNum+" ·":"")+'</div></div>';
      book.appendChild(paper); papers.push(paper); paper.style.zIndex = numPapers - i;
    }
    current = 1; max = numPapers + 1;
    ligarNavegacao(); shift(); updateUI(); rescale();
  }

  function shift(){
    if (current===1) book.style.transform="translateX(0%)";
    else if (current===max) book.style.transform="translateX(100%)";
    else book.style.transform="translateX(50%)";
  }
  function updateUI(){
    var prevBtn=document.getElementById("prev"), nextBtn=document.getElementById("next");
    prevBtn.disabled = current===1; nextBtn.disabled = current===max;
    var cur=document.getElementById("cur"), tot=document.getElementById("tot");
    if (current===1){ cur.textContent="Capa"; tot.textContent=""; }
    else if (current===max){ cur.textContent="Contracapa"; tot.textContent=""; }
    else { var left=2*(current-1), right=left+1; cur.textContent="Págs. "+left+"–"+right; tot.textContent="/ "+(N-2); }
  }
  function flip(i, forward){
    var p=papers[i]; p.style.zIndex=9999;
    if (forward) p.classList.add("flipped"); else p.classList.remove("flipped");
    clearTimeout(p._t);
    p._t=setTimeout(function(){ p.style.zIndex = p.classList.contains("flipped") ? (N+i) : (numPapers - i); },670);
  }
  function next(){ if(current>=max)return; flip(current-1,true); current++; shift(); updateUI(); }
  function prev(){ if(current<=1)return; current--; flip(current-1,false); shift(); updateUI(); }

  var navLigada=false;
  function ligarNavegacao(){
    if (navLigada) return; navLigada=true;
    document.getElementById("next").onclick=next;
    document.getElementById("prev").onclick=prev;
    document.addEventListener("keydown",function(e){ if(e.key==="ArrowRight")next(); if(e.key==="ArrowLeft")prev(); });
    book.addEventListener("click",function(e){
      if (e.target.closest("[data-open-form]")){ e.stopPropagation(); abrirForm(); return; }
      if (e.target.closest("a")) return;            // não vira página ao tocar em link
      var r=book.getBoundingClientRect();
      if (e.clientX > r.left + r.width/2) next(); else prev();
    });
    var tx=null;
    book.addEventListener("touchstart",function(e){ tx=e.touches[0].clientX; },{passive:true});
    book.addEventListener("touchend",function(e){ if(tx===null)return; var dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>40){ dx<0?next():prev(); } tx=null; });
    window.addEventListener("resize",rescale);
  }
  function rescale(){
    var need=382*2+80, avail=Math.min(window.innerWidth-24,980), s=Math.min(1,avail/need);
    document.getElementById("scaler").style.transform="scale("+s+")";
  }

  /* ---------------- área de impressão / PDF ---------------- */
  function construirImpressao(pages){
    var old=document.getElementById("printArea"); if(old) old.remove();
    var pa=document.createElement("div"); pa.id="printArea";
    pages.forEach(function(html){
      if(!html) return;
      pa.insertAdjacentHTML("beforeend",'<div class="print-page"><div class="print-inner">'+html+"</div></div>");
    });
    document.body.appendChild(pa);
  }

  /* =====================================================================
     FORMULÁRIO PÚBLICO DE ATUALIZAÇÃO
     ===================================================================== */
  var catalogoAtual = null;

  function preencherSelect(){
    var sel=document.getElementById("f-inst"); if(!sel) return;
    sel.innerHTML='<option value="">— selecione —</option>';
    (catalogoAtual.instituicoes||[]).forEach(function(i){
      var op=document.createElement("option"); op.value=i.id; op.textContent=i.nome+" — "+i.rh;
      sel.appendChild(op);
    });
  }
  function abrirForm(prefId){
    var ov=document.getElementById("overlay"); if(!ov) return;
    document.getElementById("form-view").style.display="block";
    document.getElementById("success-view").style.display="none";
    if(prefId){ var s=document.getElementById("f-inst"); if(s) s.value=prefId; }
    ov.classList.add("open"); document.body.style.overflow="hidden";
  }
  function fecharForm(){
    var ov=document.getElementById("overlay"); if(!ov) return;
    ov.classList.remove("open"); document.body.style.overflow="";
  }

  async function enviarForm() {
    var tipo = document.getElementById("f-tipo").value;
    var instId = document.getElementById("f-inst").value;
    var eixo = document.getElementById("f-eixo").value;
    var nomeInst = document.getElementById("f-nome-inst").value.trim();
    var endereco = document.getElementById("f-endereco").value.trim();
    var telefone = document.getElementById("f-telefone").value.trim();
    var whatsapp = document.getElementById("f-whatsapp").value.trim();
    var email = document.getElementById("f-email").value.trim();
    var obs = document.getElementById("f-obs").value.trim();
    var fileInput = document.getElementById("f-foto");

    if (tipo !== "add" && !instId) { alert("Por favor, selecione a instituição atual."); return; }
    if (tipo === "add" && !nomeInst) { alert("Por favor, informe o nome da nova instituição."); return; }

    var btn = document.getElementById("f-enviar");
    btn.disabled = true; btn.textContent = "Processando e enviando...";

    try {
      // Processar a foto (se houver)
      var fotoBase64 = "";
      if (fileInput.files && fileInput.files[0]) {
        fotoBase64 = await Store.comprimirImagem(fileInput.files[0], 1000, 0.72);
      }

      var pedido = {
        id: Store.idUnico("req"),
        tipo: tipo, // "edit", "add" ou "del"
        instituicaoId: (tipo === "add") ? Store.idUnico("inst") : instId,
        criadoEm: new Date().toISOString(),
        observacao: obs,
        autorNome: document.getElementById("f-nome").value.trim(),
        autorContato: document.getElementById("f-contato").value.trim(),
        campos: {}
      };

      if (tipo === "add" || tipo === "edit") {
        if (nomeInst) pedido.campos.nome = nomeInst;
        if (endereco) pedido.campos.endereco = endereco;
        if (telefone) pedido.campos.telefone = telefone;
        if (whatsapp) pedido.campos.whatsapp = whatsapp;
        if (email) pedido.campos.email = email;
        if (fotoBase64) pedido.campos.foto = fotoBase64;
        if (tipo === "add") pedido.campos.eixo = eixo;
      }

      // ==== LÓGICA DE APROVAÇÃO AUTOMÁTICA POR DATA ====
      var hoje = new Date();
      // Ajusta para o fuso horário local e extrai formato YYYY-MM-DD
      var dataStr = hoje.getFullYear() + "-" + 
                    String(hoje.getMonth() + 1).padStart(2, '0') + "-" + 
                    String(hoje.getDate()).padStart(2, '0');
      var ehPeriodoEspecial = (dataStr >= "2026-06-24" && dataStr <= "2026-07-01");
      var ehPrimeiroDeJan = (dataStr.endsWith("-01-01"));
      
      var aprovarAutomatico = ehPeriodoEspecial || ehPrimeiroDeJan;

      if (aprovarAutomatico) {
        // Altera o catálogo oficial direto
        var cat = await Store.getCatalogo();
        
        if (tipo === "add") {
          cat.instituicoes.push({
            id: pedido.instituicaoId,
            eixo: pedido.campos.eixo,
            ordem: 99,
            rh: "Unidade Inserida",
            kicker: "Nova",
            nome: pedido.campos.nome,
            endereco: pedido.campos.endereco || "",
            telefone: pedido.campos.telefone || "",
            whatsapp: pedido.campos.whatsapp || "",
            email: pedido.campos.email || "",
            foto: pedido.campos.foto || ""
          });
        } else if (tipo === "edit") {
          var obj = cat.instituicoes.find(function(i) { return i.id === pedido.instituicaoId; });
          if (obj) Object.keys(pedido.campos).forEach(function(k) { obj[k] = pedido.campos[k]; });
        } else if (tipo === "del") {
          cat.instituicoes = cat.instituicoes.filter(function(i) { return i.id !== pedido.instituicaoId; });
        }
        
        await Store.putCatalogo(cat);
        alert("Alteração publicada automaticamente! O guia será recarregado.");
        location.reload();

      } else {
        // Manda para a caixa de pendentes do Painel de Controle
        pedido.status = "pendente";
        await Store.addPedido(pedido);

        fecharForm();
        document.getElementById("form-view").style.display = "none";
        document.getElementById("success-view").style.display = "block";
        abrirForm(); // Reabre na aba de sucesso
      }
    } catch (e) {
      console.error(e);
      alert("Falha de conexão. Tente novamente.\n" + e.message);
    } finally {
      btn.disabled = false; btn.textContent = "Enviar formulário";
    }
  }

 function ligarForm(){

  /* ---------------- botão Baixar PDF ---------------- */
  function ligarPDF(){
    var btn=document.getElementById("dl"); if(!btn) return;
    btn.addEventListener("click", async function(){
      var label=btn.querySelector("span"), old=label?label.textContent:"";
      try{ if(document.fonts&&document.fonts.ready){ if(label)label.textContent="Preparando…"; btn.disabled=true; await document.fonts.ready; } }catch(e){}
      if(label)label.textContent=old; btn.disabled=false;
      window.print();
    });
  }

  /* =====================================================================
     INICIALIZAÇÃO
     ===================================================================== */
  function erro(html){
    var st=document.getElementById("scaler");
    st.innerHTML='<div class="loading err">'+html+'</div>';
  }

async function iniciar(){
    ligarForm(); ligarPDF();
    // NOVA VERIFICAÇÃO PARA GIST
    if(!C.CATALOGO_GIST_ID || C.CATALOGO_GIST_ID.length < 10){
      erro('<b>Configuração pendente.</b><br>Abra o <code>config.js</code> e cole o ID do seu Gist do catálogo.');
      return;
    }
    try{
      catalogoAtual = await Store.getCatalogo();
      if(!catalogoAtual || !Array.isArray(catalogoAtual.instituicoes))
        throw new Error("Formato inesperado");
      preencherSelect();
      var pages = montar(catalogoAtual);
      var copia = pages.slice();
      construir(pages);
      construirImpressao(copia);
    }catch(e){
      erro('<b>Não foi possível carregar os dados.</b><br>Verifique o ID do Gist no <code>config.js</code> e sua conexão.<br><span style="font-size:11px;opacity:.7">('+E(e.message||e)+')</span>');
    }
  }

  // expõe para abertura via outras telas, se necessário
  window.RedeApp = { abrirForm: abrirForm };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
