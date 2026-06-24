(function () {
  "use strict";
  var C = window.CONFIG || {};

  // Função central que usa o seu Proxy do Cloudflare
  async function proxyRequest(gistId, method, body) {
    var url = C.PROXY_BASE_URL + "?id=" + gistId;
    
    var options = { 
      method: method,
      // O seu Worker provavelmente já lida com os headers, mas mandamos o básico
      headers: { "Content-Type": "application/json" }
    };

    if (body) options.body = JSON.stringify(body);

    var r = await fetch(url, options);
    if (!r.ok) throw new Error("Erro no Proxy: " + r.status);
    
    var data = await r.json();
    // Pega o conteúdo do primeiro arquivo do Gist (catalogo.json ou caixa.json)
    var files = data.files;
    var firstFile = files[Object.keys(files)[0]];
    return JSON.parse(firstFile.content);
  }

  window.Store = {
    // Busca o catálogo via Proxy
    getCatalogo: () => proxyRequest(C.CATALOGO_GIST_ID, "GET"),

    // Salva o catálogo via Proxy (O Worker anexará o Token ghp_ automaticamente)
    putCatalogo: (obj) => {
      obj.meta.atualizadoEm = Store.hoje();
      var payload = { files: { "catalogo.json": { content: JSON.stringify(obj, null, 2) } } };
      return proxyRequest(C.CATALOGO_GIST_ID, "PATCH", payload);
    },

    // Busca os pedidos via Proxy
    getCaixa: () => proxyRequest(C.CAIXA_GIST_ID, "GET"),

    // Salva a caixa via Proxy
    putCaixa: (obj) => {
      var payload = { files: { "caixa.json": { content: JSON.stringify(obj, null, 2) } } };
      return proxyRequest(C.CAIXA_GIST_ID, "PATCH", payload);
    },

    // Adiciona um novo pedido (Público usa isso via Proxy com segurança)
    addPedido: async (pedido) => {
      var caixa = await Store.getCaixa();
      if (!caixa || !Array.isArray(caixa.pedidos)) caixa = { pedidos: [] };
      caixa.pedidos.push(pedido);
      return Store.putCaixa(caixa);
    },

    // Utilitários mantidos
    hoje: () => new Date().toISOString().split('T')[0],
    idUnico: (p) => (p || "id") + "_" + Date.now().toString(36),
    esc: (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    tamanhoKB: (obj) => Math.round(JSON.stringify(obj).length / 1024),
    comprimirImagem: (file, maxLado, qualidade) => {
        return new Promise((resolve) => {
            var reader = new FileReader();
            reader.onload = (e) => {
                var img = new Image();
                img.onload = () => {
                    var canvas = document.createElement("canvas");
                    var escala = Math.min(1, (maxLado || 1000) / Math.max(img.width, img.height));
                    canvas.width = img.width * escala; canvas.height = img.height * escala;
                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", qualidade || 0.75));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
  };
})();
