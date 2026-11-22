// Recebe o aviso da InfinitePay quando um pagamento acontece e libera o pedido.
// O aviso NÃO é assinado: por isso SEMPRE conferimos com a InfinitePay
// (payment_check) antes de liberar qualquer coisa.
//
// Também é chamada pela página pagamento-concluido.html com os dados que a
// InfinitePay coloca no endereço de volta: se o aviso atrasar, a liberação
// acontece do mesmo jeito (a conferência e a liberação são as mesmas).
//
// Publicar SEM exigir login (a InfinitePay não envia sessão):
//   supabase functions deploy aviso-infinitepay --no-verify-jwt
// ou, no painel, desligar "Verify JWT" desta função.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HANDLE = Deno.env.get('INFINITEPAY_HANDLE')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405);

  let aviso: Record<string, unknown>;
  try { aviso = await req.json(); } catch { return resposta({ erro: 'Corpo inválido.' }, 400); }

  const order_nsu = String(aviso.order_nsu || '');
  const transaction_nsu = String(aviso.transaction_nsu || '');
  const slug = String(aviso.invoice_slug || aviso.slug || '');
  if (!UUID.test(order_nsu) || !transaction_nsu || !slug) return resposta({ erro: 'Dados incompletos.' }, 400);

  const servidor = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: pedido } = await servidor.from('pedidos')
    .select('id, status, total_centavos').eq('id', order_nsu).single();
  if (!pedido) return resposta({ ok: false, motivo: 'pedido desconhecido' }); // 200: não adianta repetir
  if (pedido.status === 'pago') return resposta({ ok: true, ja_liberado: true });

  // Conferência com a InfinitePay: só libera com paid = true e valor certo
  const conferencia = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug })
  }).then((r) => r.json()).catch(() => null);

  if (!conferencia?.success || !conferencia?.paid) {
    return resposta({ ok: false, motivo: 'pagamento não confirmado' });
  }
  if (Number(conferencia.amount) !== Number(pedido.total_centavos)) {
    console.error('Valor diferente do pedido', order_nsu, conferencia.amount, pedido.total_centavos);
    return resposta({ ok: false, motivo: 'valor diferente' });
  }

  await servidor.from('pedidos').update({
    transaction_nsu,
    invoice_slug: slug,
    forma_pagamento: String(conferencia.capture_method || aviso.capture_method || ''),
    valor_pago_centavos: Number(conferencia.paid_amount || aviso.paid_amount || 0) || null,
    recibo_url: typeof aviso.receipt_url === 'string' ? aviso.receipt_url : null
  }).eq('id', order_nsu);

  const { error } = await servidor.rpc('liberar_pedido', { p_pedido: order_nsu });
  if (error) {
    console.error('Falha ao liberar', order_nsu, error);
    return resposta({ erro: 'Falha ao liberar.' }, 500); // a InfinitePay tenta de novo
  }
  return resposta({ ok: true });
});
