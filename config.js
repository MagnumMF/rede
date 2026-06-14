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

  /* URL DA API do blob do CATÁLOGO (dados públicos das instituições).
     O app LÊ daqui; o painel de controle ESCREVE aqui. */
  CATALOGO_URL: "https://api.jsonblob.com/019ec496-f338-7d8e-9708-e048091a7c86",

  /* URL DA API do blob da CAIXA DE ENTRADA (pedidos de atualização).
     O formulário público ESCREVE aqui; o painel LÊ e limpa daqui. */
  CAIXA_URL: "https://api.jsonblob.com/019ec499-3f94-7465-ab1e-cea28c292e3c",

  /* Endereço público onde o app ficará hospedado.
     Usado para gerar o QR Code da página de atualização. */
  APP_URL: "https://magnummf.github.io/rede/",

  /* Senha do painel de controle (admin.html).
     ATENÇÃO: isto apenas ESCONDE a tela de administração no navegador.
     Não é segurança real (veja a seção "Segurança" no LEIA-ME.md). */
  ADMIN_SENHA: "#infSJ01#",

  /* Textos da capa/rodapé (opcional — já vêm preenchidos). */
  TITULO: "Guia da Rede de Proteção Integral à Infância e à Adolescência",
  MUNICIPIO: "São Joaquim · SC",
  COMARCA: "Comarca de São Joaquim · SC"
};
