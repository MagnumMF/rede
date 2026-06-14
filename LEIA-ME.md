# Guia da Rede de Proteção — WebApp (PWA)

Transformação do flipbook em um aplicativo web instalável, com banco de dados,
painel de controle (admin) e formulário público de atualização.

Tudo funciona **direto no navegador**, sem servidor próprio: os dados ficam em
dois "blobs" gratuitos do **jsonblob.com**. Você só precisa hospedar a pasta de
arquivos em qualquer lugar com HTTPS.

---

## 1. O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | O app público (o flipbook). É o que as pessoas abrem. |
| `admin.html` | O **painel de controle**. Editar instituições, fotos e validar pedidos. |
| `config.js` | **O único arquivo que você edita.** URLs do banco, senha, textos. |
| `store.js` | Camada que conversa com o jsonblob. Não precisa mexer. |
| `app.js` | Lógica do flipbook e do formulário público. Não precisa mexer. |
| `admin.js` | Lógica do painel. Não precisa mexer. |
| `styles.css` | Aparência (mantém a identidade visual da cartilha). |
| `manifest.webmanifest` | Faz o app ser "instalável" (PWA). |
| `service-worker.js` | Cache para abrir rápido e funcionar offline. |
| `icons/` | Ícones do app (192/512 + versões maskable). |
| `seed-data.json` | Conteúdo inicial do **catálogo** (as 13 instituições). |
| `seed-inbox.json` | Conteúdo inicial da **caixa de entrada** (vazia). |
| `make_icons.py` | Script que gerou os ícones (opcional, caso queira recriá-los). |

---

## 2. Criar o banco de dados (2 blobs no jsonblob)

O app usa **dois** blobs separados, de propósito:

- **CATÁLOGO** — os dados públicos das instituições. O app *lê*; o painel *escreve*.
- **CAIXA** — os pedidos de atualização do público. O formulário *escreve*; o painel *lê e limpa*.

Manter separados é uma proteção: o formulário público nunca consegue
sobrescrever o catálogo.

Passo a passo (faça duas vezes):

1. Acesse **https://jsonblob.com**.
2. Apague o conteúdo de exemplo na tela.
3. **Blob do CATÁLOGO:** cole TODO o conteúdo do arquivo `seed-data.json` e clique em **Save**.
4. Copie a URL que aparece na barra do navegador. Ela é parecida com:
   `https://jsonblob.com/1234567890123456789`
5. A URL que o app usa é a **da API** — troque o caminho para incluir `/api/jsonBlob/`:
   `https://jsonblob.com/api/jsonBlob/1234567890123456789`
6. Repita os passos 2 a 5 num novo blob para a **CAIXA**, colando o conteúdo de `seed-inbox.json`.

No fim você terá duas URLs de API (uma do catálogo, uma da caixa).

> **Atenção à retenção:** o jsonblob remove blobs que ficam **75 dias sem
> acesso**. O uso normal do app mantém os blobs "vivos". Ainda assim, faça
> backups (veja a seção 6).

---

## 3. Preencher o `config.js`

Abra `config.js` num editor de texto e preencha:

- `CATALOGO_URL` → a URL de API do blob do **catálogo**.
- `CAIXA_URL` → a URL de API do blob da **caixa**.
- `APP_URL` → o endereço onde o app ficará hospedado (usado no QR Code).
- `ADMIN_SENHA` → **troque** `"trocar-esta-senha"` por uma senha sua.
- `TITULO`, `MUNICIPIO`, `COMARCA` → já vêm preenchidos; ajuste se quiser.

Salve o arquivo. Pronto — é o único arquivo que precisa de edição.

---

## 4. Hospedar (precisa ser HTTPS)

PWA e service worker **só funcionam em HTTPS** (ou em `localhost` para testes).
Qualquer uma destas opções gratuitas serve:

- **GitHub Pages** — suba a pasta num repositório e ative o Pages.
- **Netlify** ou **Cloudflare Pages** — arraste a pasta na interface ("drag and drop").

Depois de hospedar, abra o endereço no celular: o navegador deve oferecer
**"Adicionar à tela inicial" / "Instalar app"**.

Para testar localmente antes de publicar:

```
cd rede
python3 -m http.server 8000
```

e abra `http://localhost:8000`.

> Os arquivos usam scripts clássicos (não módulos) justamente para que você
> consiga abrir e testar sem dor de cabeça de CORS.

---

## 5. Usar o painel de controle

1. Acesse `https://SEU-ENDERECO/admin.html`.
2. Digite a senha definida no `config.js`.
3. Aba **Instituições**: edite textos e contatos, salve cada cartão.
   - Foto: **Enviar imagem** (o app comprime sozinho) ou **Colar URL** de uma imagem pública.
   - O medidor mostra o tamanho do catálogo em KB. Se passar de ~180 KB,
     prefira fotos por **URL** em vez de enviadas (mantém o banco leve).
4. Aba **Pedidos pendentes**: cada correção enviada pelo público aparece com a
   comparação *valor atual → valor proposto*. Clique em **Aplicar e publicar**
   (grava no catálogo e remove o pedido) ou **Rejeitar**.

O público atualiza os dados pelo botão **"Atualizar dados agora"** dentro do app,
ou pelo **QR Code** da página de atualização.

---

## 6. Backup (importante)

No painel, aba Instituições, use **Exportar (backup)** para baixar um `.json`
com todo o catálogo. Guarde com regularidade. Se algo der errado (ou o blob
expirar por inatividade), use **Importar** para restaurar.

---

## 7. Publicar na Google Play Store (opcional)

Um PWA pode ser empacotado como app Android via **TWA (Trusted Web Activity)**.
Caminho recomendado:

1. Tenha o app no ar em HTTPS, com `manifest.webmanifest` e ícones (já incluídos).
2. Acesse **https://www.pwabuilder.com**, informe a URL do app e gere o pacote
   **Android** (ele usa o Bubblewrap por baixo).
3. O PWABuilder gera um arquivo **`assetlinks.json`**. Coloque-o em
   `https://SEU-ENDERECO/.well-known/assetlinks.json` para validar a posse do domínio.
4. Crie uma conta de **Google Play Console** (taxa única de US$ 25) e envie o
   pacote (`.aab`).

Requisitos que o app já cumpre: manifest, ícones 192/512 + maskable,
service worker, display `standalone`, tema definido.

---

## 8. Segurança — leia com atenção

- A senha do painel é **apenas um portão visual no navegador**. Qualquer pessoa
  com conhecimento técnico e a URL do blob consegue ler/escrever no banco, porque
  o jsonblob **não tem autenticação**. Isso é uma limitação da escolha do
  jsonblob, não do app.
- O impacto é **baixo** aqui porque os dados são públicos por natureza
  (endereços e telefones de órgãos). A preocupação real é **vandalismo/integridade**,
  não sigilo. As defesas adotadas: blobs separados, backups por exportação, e a
  camada `store.js` isolada.
- **Nunca** coloque dados sensíveis ou pessoais de crianças/adolescentes neste banco.

### Quando quiser segurança real

Troque o jsonblob por um back-end com autenticação. Como a lógica de dados está
concentrada em `store.js`, basta reescrever essa camada apontando para, por
exemplo:

- **Cloudflare Workers + KV** (gratuito para esse volume; permite exigir senha no servidor),
- **Supabase** ou **Firebase** (banco + regras de acesso),

mantendo os mesmos métodos (`getCatalogo`, `putCatalogo`, `getCaixa`,
`addPedido`, `putCaixa`). O resto do app não muda.

---

## 9. Observações finais

- O **QR Code** e fotos por URL externa precisam de internet para carregar a
  primeira vez (o service worker guarda em cache depois).
- Ao publicar uma **nova versão** dos arquivos, troque o número em
  `CACHE_VERSION` dentro de `service-worker.js` para que os aparelhos atualizem.
- A descrição das instituições aceita HTML simples (ex.: `<b>negrito</b>`),
  pensada para uso pelo administrador. Os demais campos são tratados como texto.
