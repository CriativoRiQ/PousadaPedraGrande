/* =========================================================
   CONFIGURAÇÃO DO SITE — preencha com os dados reais
   Tudo que estiver vazio ('') fica DESATIVADO automaticamente.
   ========================================================= */
window.PPG_CONFIG = {
  // WhatsApp que recebe as cotações — somente números com DDI+DDD, ex.: '5584999999999'
  // (enquanto estiver vazio, o WhatsApp abre com a mensagem pronta e o visitante escolhe o contato)
  WHATSAPP: '',
  FORM_ENDPOINT: '',   // opcional: também registra cada lead (POST JSON) em CRM/planilha — Formspree, Make, n8n…
  INSTAGRAM_USER: 'pousadapedragrande',

  // Trilha sonora: caminho de um MP3 licenciado (ex.: 'assets/audio/trilha.mp3').
  // Vazio = trilha de piano e sax gerada no próprio navegador.
  MUSIC_URL: '',

  // Rastreamento (carregado somente após consentimento — LGPD)
  GTM_ID: '',          // ex.: 'GTM-XXXXXXX'  (se usar GTM, configure GA4/Ads/Pixel dentro dele e deixe os campos abaixo vazios)
  GA4_ID: '',          // ex.: 'G-XXXXXXXXXX'
  GOOGLE_ADS_ID: '',   // ex.: 'AW-XXXXXXXXX'
  GOOGLE_ADS_LEAD_LABEL: '', // rótulo da conversão de lead no Google Ads
  META_PIXEL_ID: ''    // ex.: '123456789012345'
};
