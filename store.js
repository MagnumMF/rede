/* =====================================================================
   STORE.JS — Camada de Dados (GitHub Gists Edition)
   ---------------------------------------------------------------------
   Gerencia a comunicação com a API do GitHub para ler e salvar dados.
   ===================================================================== */
(function () {
  "use strict";
  var C = window.CONFIG || {};

  /**
   * Comunicação central com a API do GitHub
   * @param {string} gistId - ID do Gist
   * @param {string} method - GET ou PATCH
   * @param {object} body - Dados para enviar (opcional)
   * @param {string} token - Token ghp_... (opcional)
   */
  async function githubRequest(gistId, method, body, token) {
    // Adicionamos um timestamp para evitar cache do navegador na leitura (GET)
    var url = "https://api.github.com/gists/" + gistId + (method === "GET" ? "?t=" + Date.now() : "");
    
    var headers = { 
      "Accept": "application/vnd.github+json"
    };
    
    // Se um token for fornecido (via Admin), adiciona ao cabeçalho de autorização
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    var options = { method: method, headers: headers };
    if (body) options.body = JSON.stringify(body);

    var r = await fetch(url, options);
    
    if (!r.ok) {
      if (r.status === 401) throw new Error("401: Token inválido ou expirado.");
      if (r.status === 404) throw new Error("404: Gist não encontrado. Verifique os IDs no config.js.");
      throw new Error("Erro GitHub: " + r.status);
    }
    
    var data = await r.json();
    
    // Pega o conteúdo do primeiro arquivo encontrado no Gist (independente do nome)
    var files = data.files;
    var firstFile = files[Object.keys(files)[0]];
    
    // Retorna o conteúdo convertido de volta para Objeto Javascript
    return JSON.parse(firstFile.content);
  }

  /* -------- Funções de Interface (Catálogo) -------- */
  
  // O app público chama sem token. O Admin chama passando o token.
  async function getCatalogo(token) { 
    return githubRequest(C.CATALOGO_GIST_ID, "GET", null, token); 
  }

  async function putCatalogo(obj, token) {
    if (!token) throw new Error("Ação requer autenticação (Token).");
    
    obj.meta = obj.meta || {};
    obj.meta.atualizadoEm = hoje();
    obj.meta.versao = (obj.meta.versao || 0) + 1;

    var payload = {
      files: { "catalogo.json": { content: JSON.stringify(obj, null, 2) } }
    };
    return githubRequest(C.CATALOGO_GIST_ID, "PATCH", payload, token);
  }

  /* -------- Funções de Interface (Caixa de Pedidos) -------- */

  async function getCaixa(token) { 
    if (!token) throw new Error("Ação requer autenticação (Token).");
    return githubRequest(C.CAIXA_GIST_ID, "GET", null, token); 
  }

  async function putCaixa(obj, token) {
    if (!token) throw new Error("Ação requer autenticação (Token).");
    
    var payload = {
      files: { "caixa.json": { content: JSON.stringify(obj, null, 2) } }
    };
    return githubRequest(C.CAIXA_GIST_ID, "PATCH", payload, token);
  }

  // Nota: addPedido no Gist exigiria um Token Público (perigoso).
  // Por isso, no app.js, mudamos o envio para WhatsApp.
  async function addPedido(pedido) {
    console.warn("addPedido desativado via API por segurança. Use o WhatsApp.");
    return false;
  }

  /* -------- Utilitários -------- */

  function hoje() {
    var d = new Date();
    return d.getFullYear() + "-" + 
           String(d.getMonth() + 1).padStart(2, "0") + "-" + 
           String(d.getDate()).padStart(2, "0");
  }

  function idUnico(prefixo) {
    return (prefixo || "id") + "_" + Date.now().toString(36) + "_" + 
           Math.random().toString(36).slice(2, 7);
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function tamanhoKB(obj) {
    if (!obj) return 0;
    return Math.round(JSON.stringify(obj).length / 1024);
  }

  function comprimirImagem(file, maxLado, qualidade) {
    maxLado = maxLado || 1000; qualidade = qualidade || 0.72;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Não foi possível ler o arquivo.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Imagem inválida.")); };
        img.onload = function () {
          var w = img.width, h = img.height;
          var escala = Math.min(1, maxLado / Math.max(w, h));
          var cw = Math.round(w * escala), ch = Math.round(h * escala);
          var cv = document.createElement("canvas");
          cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(cv.toDataURL("image/jpeg", qualidade));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Helper para recuperar o token da sessão (usado pelo admin.js)
  function getToken() {
    return sessionStorage.getItem("rede_admin_token");
  }

  /* Exportação do Módulo */
  window.Store = {
    getCatalogo: getCatalogo,
    putCatalogo: putCatalogo,
    getCaixa: getCaixa,
    putCaixa: putCaixa,
    addPedido: addPedido,
    getToken: getToken,
    hoje: hoje,
    idUnico: idUnico,
    esc: esc,
    tamanhoKB: tamanhoKB,
    comprimirImagem: comprimirImagem
  };
})();
