// Pixel do Meta (Instagram e Facebook): mede visitas, produtos vistos, checkouts e compras
// para os anúncios. Carregado em todas as páginas, menos no Painel (admin.html).
// Eventos: PageView (aqui), ViewContent (produto.html), InitiateCheckout (portal.js, antes
// de ir à InfinitePay) e Purchase (pagamento-concluido.html, com o valor do pedido).
(function () {
  var PIXEL_ID = '1664681518623718';
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  // Atalho para as páginas: eePixel('ViewContent', { ... }, 'id-unico-opcional').
  // Nunca quebra a página (bloqueador de anúncio, rede fora etc.).
  window.eePixel = function (evento, dados, idEvento) {
    try {
      window.fbq('track', evento, dados || {}, idEvento ? { eventID: idEvento } : undefined);
    } catch (e) { /* sem pixel: segue normal */ }
  };
})();
