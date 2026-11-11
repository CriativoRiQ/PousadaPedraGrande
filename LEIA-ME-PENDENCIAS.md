# Pousada Pedra Grande — site (RiQ Tecnologias Digitais)

## Estrutura
- `index.html` — landing page (one page)
- `politica-de-privacidade.html` — política de privacidade e cookies (LGPD)
- `404.html` — página de erro
- `assets/css/style.css` · `assets/js/config.js` · `assets/js/consent.js` · `assets/js/main.js`
- `assets/img/` — fotos otimizadas em WebP (480 e 800 px), logo e imagem Open Graph
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons, `.htaccess` (HTTPS, cache, compressão, segurança, 404)

## Publicação
1. Envie o conteúdo desta pasta para a raiz do domínio (public_html).
2. Ative o SSL (Let's Encrypt/AutoSSL) — o `.htaccess` já redireciona para HTTPS e remove o "www".
3. Envie o `sitemap.xml` no Google Search Console.

## Para ativar (preencha `assets/js/config.js`)
| Campo | O que acontece |
|---|---|
| `WHATSAPP` | Número que recebe as cotações (barra de cotação e formulário). Vazio = o WhatsApp abre com a mensagem pronta e o visitante escolhe o contato |
| `FORM_ENDPOINT` | Opcional: registra cada lead (POST JSON) em CRM/planilha, com UTMs |
| `MUSIC_URL` | Opcional: MP3 licenciado para a trilha. Vazio = piano + sax gerados no navegador |
| `GTM_ID` ou `GA4_ID` / `GOOGLE_ADS_ID` / `GOOGLE_ADS_LEAD_LABEL` / `META_PIXEL_ID` | Tags carregadas somente após consentimento (Consent Mode v2) |

Mensagem enviada ao WhatsApp: "Oi, sou {nome}, vim do site e gostaria de uma cotação." + check-in, check-out (nº de noites), adultos, crianças e mensagem.

A pilha de cartas usa as molas da biblioteca Motion (cdn.jsdelivr.net); se o CDN não carregar, uma mola própria equivalente assume.

Eventos enviados ao `dataLayer`: `cta_reservar`, `generate_lead`, `stack_card`, `faq_open`, `music_play`, `music_pause`, `visita_3d`, `click_social`, `como_chegar`, `map_load`, `consent_update`.

## Pendências — dependem da pousada
- **Número do WhatsApp** que vai receber as cotações (campo `WHATSAPP`).
- **CNPJ / razão social**: incluir na Política de Privacidade.
- **Dados obtidos em anúncio público (Expedia) — confirmar**: endereço, 12 acomodações, check-in 14h / check-out 12h, café da manhã das 7h às 10h, amenidades, política de crianças e pets, distância da Pedra da Boca, nota 9,2 e notas por critério, e os 4 depoimentos citados.
- **Tipos de acomodação e tarifas**: não informados — por isso o site direciona para "Consultar disponibilidade".
- **Fotos**: o material tem só 3 fotos, em 800×600 px. Recomenda-se enviar fotos em alta resolução (mín. 1920 px) dos quartos, do café, da piscina, das trilhas e do Atelier.
- **Logo em vetor** (SVG/PDF): o arquivo atual é um PNG de 134×63 px.
- **Visita 3D**: o link `http://pousadapedragrandern.com.br/video/` é do site antigo e usa HTTP; confirmar se continua no ar.
- **Domínio canônico**: configurado como `https://pousadapedragrandern.com.br/` (o material veio de `novo.pousadapedragrandern.com.br`).
- **Fontes**: carregadas do Google Fonts (Yeseva One + Inter). Opcional: hospedá-las localmente.
