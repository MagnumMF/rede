/* =====================================================================
   CONFIG.JS  —  O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR
   ---------------------------------------------------------------------
   Leia o LEIA-ME.md para o passo a passo completo. Em resumo:

   1) Crie DOIS "blobs" gratuitos em https://jsonblob.com
        • CATÁLOGO  -> cole o conteúdo de  seed-data.json
        • CAIXA     -> cole o conteúdo de  seed-inbox.json
      Ao salvar cada um, a URL da barra do navegador vira algo como:
        https://jsonblob.com/019ec496-f338-7d8e-9708-e048091a7c86
      Pegue só o ID do final e monte a URL DA API neste formato:
        https://api.jsonblob.com/019ec496-f338-7d8e-9708-e048091a7c86
      (a base é  api.jsonblob.com  e o caminho é o ID direto — sem
       /api/jsonBlob/. Esse é o endereço oficial atual da API.)

   2) Cole as duas URLs de API abaixo.
   3) Defina a senha do painel de controle.
   4) Hospede a pasta num servidor HTTPS (GitHub Pages, Netlify, etc.).
   ===================================================================== */

window.CONFIG = {
  /* IDs dos Gists (aquela parte final da URL) */
  CATALOGO_GIST_ID: "8a808b01b2f4f15dbc6999ec6c70c083",
  CAIXA_GIST_ID: "9ef265c19a55d1de928039bc936de0fb",

  /* O Token que você gerou no Passo 2 */
  GITHUB_TOKEN: "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",

  /* Configurações visuais */
  APP_URL: "https://magnummf.github.io/rede/",
  ADMIN_SENHA: "#infSJ01#",
  TITULO: "Guia da Rede de Proteção Integral à Infância e à Adolescência",
  MUNICIPIO: "São Joaquim · SC",
  COMARCA: "Comarca de São Joaquim · SC"
};
