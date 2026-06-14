/* =====================================================================
   STORE.JS — Acesso ao banco de dados (JSONBlob) e utilitários
   ---------------------------------------------------------------------
   Camada única de leitura/escrita. Se um dia você trocar o JSONBlob por
   outro back-end, basta reescrever as quatro funções de rede abaixo
   (getCatalogo / putCatalogo / getCaixa / putCaixa).
   ===================================================================== */
(function () {
  "use strict";

  var C = window.CONFIG || {};

  function jsonHeaders() {
    return { "Content-Type": "application/json", "Accept": "application/json" };
  }

  async function getJSON(url) {
    // GET sem Content-Type = requisição "simples" (não dispara preflight CORS).
    var r = await fetch(url, { method: "GET", cache: "no-store" });
    if (!r.ok) throw new Error("Falha ao ler (" + r.status + ")");
    return r.json();
  }

  async function putJSON(url, obj) {
    var r = await fetch(url, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(obj)
    });
    if (!r.ok) throw new Error("Falha ao gravar (" + r.status + ")");
    return true;
  }

  /* -------- Catálogo (dados públicos das instituições) -------- */
  function getCatalogo() { return getJSON(C.CATALOGO_URL); }
  function putCatalogo(obj) {
    obj.meta = obj.meta || {};
    obj.meta.atualizadoEm = hoje();
    obj.meta.versao = (obj.meta.versao || 0) + 1;
    return putJSON(C.CATALOGO_URL, obj);
  }

  /* -------- Caixa de entrada (pedidos do público) -------- */
  function getCaixa() { return getJSON(C.CAIXA_URL); }
  function putCaixa(obj) { return putJSON(C.CAIXA_URL, obj); }

  /* Acrescenta um pedido lendo-gravando (com 1 retentativa simples para
     reduzir conflito quando duas pessoas enviam ao mesmo tempo). */
  async function addPedido(pedido) {
    for (var tentativa = 0; tentativa < 2; tentativa++) {
      var caixa = await getCaixa();
      if (!caixa || typeof caixa !== "object") caixa = { pedidos: [] };
      if (!Array.isArray(caixa.pedidos)) caixa.pedidos = [];
      caixa.pedidos.push(pedido);
      try {
        await putCaixa(caixa);
        return true;
      } catch (e) {
        if (tentativa === 1) throw e;
        await espera(400);
      }
    }
  }

  /* ----------------------- Utilitários ----------------------- */
  function hoje() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function espera(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function idUnico(prefixo) {
    return (prefixo || "id") + "_" + Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 7);
  }

  /* Escapa texto para inserir com segurança como conteúdo HTML. */
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Tamanho aproximado de um objeto JSON, em KB (para o "medidor"). */
  function tamanhoKB(obj) {
    try { return Math.round(new Blob([JSON.stringify(obj)]).size / 1024); }
    catch (e) { return Math.round(JSON.stringify(obj).length / 1024); }
  }

  /* Reduz uma imagem no próprio navegador antes de salvar (evita inflar
     o blob). Retorna uma string data:image/jpeg;base64,... */
  function comprimirImagem(file, maxLado, qualidade) {
    maxLado = maxLado || 1000; qualidade = qualidade || 0.72;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Não foi possível ler o arquivo.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Arquivo de imagem inválido.")); };
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

  window.Store = {
    getCatalogo: getCatalogo, putCatalogo: putCatalogo,
    getCaixa: getCaixa, putCaixa: putCaixa, addPedido: addPedido,
    hoje: hoje, idUnico: idUnico, esc: esc,
    tamanhoKB: tamanhoKB, comprimirImagem: comprimirImagem,
    config: C
  };
})();
