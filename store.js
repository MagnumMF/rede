(function () {
  "use strict";
  var C = window.CONFIG || {};

  // Auxiliar para falar com a API do GitHub
  async function githubRequest(gistId, method, body) {
    var url = "https://api.github.com/gists/" + gistId;
    var headers = { "Accept": "application/vnd.github+json" };
    
    // Só envia o token se for para gravar (PATCH)
    if (method === "PATCH") {
      headers["Authorization"] = "Bearer " + C.GITHUB_TOKEN;
    }

    var options = { method: method, headers: headers };
    if (body) options.body = JSON.stringify(body);

    var r = await fetch(url, options);
    if (!r.ok) throw new Error("Erro GitHub: " + r.status);
    
    var data = await r.json();
    // O GitHub retorna os arquivos dentro do objeto 'files'
    var fileName = Object.keys(data.files)[0];
    return JSON.parse(data.files[fileName].content);
  }

  /* -------- Funções de Interface -------- */
  
  async function getCatalogo() { 
    return githubRequest(C.CATALOGO_GIST_ID, "GET"); 
  }

  async function putCatalogo(obj) {
    obj.meta = obj.meta || {};
    obj.meta.atualizadoEm = hoje();
    obj.meta.versao = (obj.meta.versao || 0) + 1;

    var payload = {
      files: { "catalogo.json": { content: JSON.stringify(obj, null, 2) } }
    };
    return githubRequest(C.CATALOGO_GIST_ID, "PATCH", payload);
  }

  async function getCaixa() { 
    return githubRequest(C.CAIXA_GIST_ID, "GET"); 
  }

  async function putCaixa(obj) {
    var payload = {
      files: { "caixa.json": { content: JSON.stringify(obj, null, 2) } }
    };
    return githubRequest(C.CAIXA_GIST_ID, "PATCH", payload);
  }

  async function addPedido(pedido) {
    var caixa = await getCaixa();
    if (!caixa || !Array.isArray(caixa.pedidos)) caixa = { pedidos: [] };
    caixa.pedidos.push(pedido);
    return putCaixa(caixa);
  }

  /* -------- Utilitários (mantidos) -------- */
  function hoje() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function idUnico(prefixo) {
    return (prefixo || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function tamanhoKB(obj) {
    return Math.round(JSON.stringify(obj).length / 1024);
  }
  function comprimirImagem(file, maxLado, qualidade) {
    maxLado = maxLado || 1000; qualidade = qualidade || 0.72;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height;
          var escala = Math.min(1, maxLado / Math.max(w, h));
          var cv = document.createElement("canvas");
          cv.width = Math.round(w * escala); cv.height = Math.round(h * escala);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", qualidade));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.Store = {
    getCatalogo: getCatalogo, putCatalogo: putCatalogo,
    getCaixa: getCaixa, putCaixa: putCaixa, addPedido: addPedido,
    hoje: hoje, idUnico: idUnico, esc: esc,
    tamanhoKB: tamanhoKB, comprimirImagem: comprimirImagem
  };
})();
