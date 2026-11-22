// Cria um pagamento na InfinitePay (Checkout Integrado) só com os itens escolhidos.
// Chamada pelo site com a pessoa logada. Os preços são calculados AQUI, no servidor:
// o navegador só diz o que quer comprar, nunca quanto custa.
//
// Variáveis (Supabase → Edge Functions → Secrets):
//   INFINITEPAY_HANDLE  sua InfiniteTag, sem o $ (ex.: entreestrelas)
//   SITE_URL            endereço do site, sem barra no fim (ex.: https://entreestrelas.com)
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HANDLE = Deno.env.get('INFINITEPAY_HANDLE')!;
const SITE_URL = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resposta({ erro: 'Método não permitido.' }, 405);

  // 1) Quem está comprando (sessão do site)
  const autorizacao = req.headers.get('Authorization') || '';
  const comoUsuario = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: autorizacao } } });
  const { data: { user } } = await comoUsuario.auth.getUser();
  if (!user) return resposta({ erro: 'Entre na sua área antes de comprar.' }, 401);

  const servidor = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: cliente } = await servidor.from('clientes')
    .select('id, nome, email, whatsapp').eq('user_id', user.id).single();
  if (!cliente) return resposta({ erro: 'Cadastro não encontrado.' }, 400);

  // 2) O que a pessoa quer (até 5 itens): [{ slug, presente }]
  let pedidoBruto: { itens?: { slug: string; presente?: boolean }[] };
  try { pedidoBruto = await req.json(); } catch { return resposta({ erro: 'Pedido inválido.' }, 400); }
  const escolhidos = (pedidoBruto.itens || []).slice(0, 5);
  if (!escolhidos.length) return resposta({ erro: 'Nenhum item escolhido.' }, 400);

  const { data: produtos } = await servidor.from('produtos')
    .select('id, slug, nome, preco_centavos, preco_membro_centavos, preco_presente_membro_centavos, permite_presente, ativo, concede_plano, venda_ate')
    .in('slug', escolhidos.map((i) => i.slug)).eq('ativo', true);

  // Membro = plano ativo (Fundador/Comunidade): paga o preço de membro nos presentes
  const { data: planos } = await servidor.from('assinaturas')
    .select('id, fim, plano_id').eq('cliente_id', cliente.id).eq('status', 'ativa');
  const membro = (planos || []).some((p) => !p.fim || new Date(p.fim) > new Date());

  // 3) Preços calculados no servidor
  const itens = [];
  for (const escolha of escolhidos) {
    const p = (produtos || []).find((x) => x.slug === escolha.slug);
    if (!p) return resposta({ erro: `Item indisponível: ${escolha.slug}` }, 400);
    const presente = Boolean(escolha.presente);
    if (presente && !p.permite_presente) return resposta({ erro: `${p.nome} não pode ser dado de presente.` }, 400);
    if (p.venda_ate && new Date(p.venda_ate) < new Date()) return resposta({ erro: `As vendas de ${p.nome} foram encerradas.` }, 400);
    if (p.concede_plano && (planos || []).some((a) => a.plano_id === p.concede_plano)) return resposta({ erro: `Você já é ${p.nome}.` }, 400);
    // Membro paga o preço de membro: para presentear (se houver) ou para si
    const precoMembro = presente ? (p.preco_presente_membro_centavos || p.preco_membro_centavos) : p.preco_membro_centavos;
    const preco = membro && precoMembro ? precoMembro : p.preco_centavos;
    if (!preco || preco < 100) return resposta({ erro: `${p.nome} ainda não tem preço.` }, 400);
    itens.push({ produto_id: p.id, slug: p.slug, nome: p.nome, presente, preco_centavos: preco });
  }
  const total = itens.reduce((soma, i) => soma + i.preco_centavos, 0);

  // 4) Registra o pedido (o id vira o order_nsu na InfinitePay)
  const { data: pedido, error: erroPedido } = await servidor.from('pedidos')
    .insert({ cliente_id: cliente.id, itens, total_centavos: total }).select('id').single();
  if (erroPedido || !pedido) return resposta({ erro: 'Não foi possível registrar o pedido.' }, 500);

  // 5) Pede o link à InfinitePay
  const cliente_ip: Record<string, string> = {};
  if (cliente.nome) cliente_ip.name = cliente.nome;
  if (cliente.email) cliente_ip.email = cliente.email;
  if (cliente.whatsapp) cliente_ip.phone_number = cliente.whatsapp;

  const ip = await fetch('https://api.checkout.infinitepay.io/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: HANDLE,
      order_nsu: pedido.id,
      redirect_url: `${SITE_URL}/pagamento-concluido.html`,
      webhook_url: `${SUPABASE_URL}/functions/v1/aviso-infinitepay`,
      items: itens.map((i) => ({
        quantity: 1,
        price: i.preco_centavos,
        description: i.presente ? `${i.nome} (presente)` : i.nome
      })),
      ...(Object.keys(cliente_ip).length ? { customer: cliente_ip } : {})
    })
  });
  const retorno = await ip.json().catch(() => ({}));
  if (!ip.ok || !retorno.url) {
    console.error('InfinitePay recusou o link', ip.status, retorno);
    await servidor.from('pedidos').update({ status: 'cancelado' }).eq('id', pedido.id);
    return resposta({ erro: 'O pagamento não pôde ser iniciado agora. Tente de novo em instantes.' }, 502);
  }

  await servidor.from('pedidos').update({ link_pagamento: retorno.url }).eq('id', pedido.id);
  return resposta({ url: retorno.url, pedido: pedido.id, total_centavos: total });
});
