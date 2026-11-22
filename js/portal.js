// Camada de contas do portal Entre Estrelas: login, cadastro, produtos.
// Usado por entrar.html, minha-area.html, admin.html e pelo app.js (mapa).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const configurado = /^https:\/\//.test(SUPABASE_URL) && !SUPABASE_ANON_KEY.startsWith('COLE_');

export const supabase = configurado
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true } })
  : null;

function exigirConfiguracao() {
  if (!configurado) throw new Error('O login ainda não foi configurado. Preencha js/supabase-config.js.');
}

// Mensagens do Supabase (em inglês) traduzidas para o cliente.
const MENSAGENS = [
  [/rate limit|too many requests|security purposes/i,
    'Muitos pedidos de acesso em pouco tempo. Aguarde alguns minutos e tente de novo. Se você já pediu um link, confira seu e-mail (e a caixa de spam).'],
  [/invalid.*email|email.*invalid|unable to validate email/i, 'Este e-mail não parece válido. Confira se foi digitado corretamente.'],
  [/expired|otp_expired|invalid.*(token|link)/i, 'Este link ou código expirou, está incorreto ou já foi usado. Confira o e-mail mais recente ou peça um novo.'],
  [/provider is not enabled|unsupported provider/i, 'O login com Google ainda não está disponível. Use o seu e-mail.'],
  [/failed to fetch|network/i, 'Não foi possível conectar. Verifique sua internet e tente de novo.']
];

function falha(error, mensagemPadrao) {
  if (!error) return;
  console.error(error);
  const traduzida = MENSAGENS.find(([padrao]) => padrao.test(error.message || ''));
  throw new Error(traduzida ? traduzida[1] : (error.message || mensagemPadrao));
}

// ------------------------------------------------------------------ login

export function urlDoSite(caminho) {
  return new URL(caminho, window.location.href).href;
}

// dadosCadastro (só usados no primeiro acesso): { aceita_novidades: 'true'|'false', origem }
export async function enviarLinkMagico(email, destino = 'minha-area.html', dadosCadastro = {}) {
  exigirConfiguracao();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: urlDoSite(destino), shouldCreateUser: true, data: dadosCadastro }
  });
  falha(error, 'Não foi possível enviar o link de acesso.');
}

// Código numérico (hoje 8 dígitos) que vai no mesmo e-mail do link (para entrar em outro aparelho).
export async function entrarComCodigo(email, codigo) {
  exigirConfiguracao();
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: String(codigo).replace(/\D/g, ''),
    type: 'email'
  });
  falha(error, 'Código inválido ou expirado.');
}

// Login com Google. O consentimento/origem ficam guardados no navegador e são
// aplicados ao cadastro na primeira visita depois do login (ver meuCadastro).
export async function entrarComGoogle(destino = 'minha-area.html', dadosCadastro = {}) {
  exigirConfiguracao();
  localStorage.setItem('ee-cadastro-pendente', JSON.stringify(dadosCadastro));
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: urlDoSite(destino) }
  });
  falha(error, 'Não foi possível entrar com o Google.');
}

// O botão do Google só aparece quando o Google estiver ligado no Supabase.
export async function googleDisponivel() {
  if (!configurado) return false;
  try {
    const resposta = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    return Boolean((await resposta.json())?.external?.google);
  } catch {
    return false;
  }
}

export async function sessaoAtual() {
  if (!configurado) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sair() {
  if (!configurado) return;
  await supabase.auth.signOut();
}

export function aoMudarLogin(callback) {
  if (!configurado) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => callback(sessao));
  return () => data.subscription.unsubscribe();
}

// --------------------------------------------------------------- cadastro

export async function meuCadastro() {
  exigirConfiguracao();
  const sessao = await sessaoAtual();
  if (!sessao) return null;
  const { data, error } = await supabase
    .from('clientes')
    .select('id, email, nome, whatsapp, papel, aceita_novidades, origem')
    .eq('user_id', sessao.user.id)
    .maybeSingle();
  falha(error, 'Não foi possível carregar seu cadastro.');
  return data ? aplicarCadastroPendente(data) : data;
}

// Quem entrou pelo Google: aplica o "quero receber novidades" e a origem
// escolhidos na tela de entrar (o Google não carrega esses dados).
async function aplicarCadastroPendente(cliente) {
  const texto = localStorage.getItem('ee-cadastro-pendente');
  if (!texto) return cliente;
  localStorage.removeItem('ee-cadastro-pendente');
  try {
    const pendente = JSON.parse(texto);
    const mudancas = {};
    if (pendente.aceita_novidades === 'true' && !cliente.aceita_novidades) mudancas.aceita_novidades = true;
    if (pendente.origem && !cliente.origem) mudancas.origem = String(pendente.origem).slice(0, 60);
    if (Object.keys(mudancas).length) {
      await supabase.from('clientes').update(mudancas).eq('id', cliente.id);
      Object.assign(cliente, mudancas);
    }
  } catch (erro) {
    console.warn('Preferências do cadastro não aplicadas.', erro);
  }
  return cliente;
}

export async function atualizarMeuCadastro(clienteId, { nome, whatsapp, aceita_novidades }) {
  exigirConfiguracao();
  const { error } = await supabase.from('clientes').update({ nome, whatsapp, aceita_novidades }).eq('id', clienteId);
  falha(error, 'Não foi possível salvar seu cadastro.');
}

export async function meusProdutos() {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('meus_produtos');
  falha(error, 'Não foi possível carregar seus produtos.');
  return data || [];
}

export async function minhasAssinaturas(clienteId) {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('assinaturas')
    .select('plano_id, status, inicio, fim, planos(nome)')
    .eq('cliente_id', clienteId)
    .eq('status', 'ativa');
  falha(error, 'Não foi possível carregar seus planos.');
  const agora = Date.now();
  return (data || []).filter((a) => !a.fim || new Date(a.fim).getTime() > agora);
}

// Lançamentos "Em breve": a pessoa se inscreve para receber as informações.
export async function inscrever(clienteId, produtoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('inscricoes').insert({ cliente_id: clienteId, produto_id: produtoId });
  if (error && !/duplicate/i.test(error.message)) falha(error, 'Não foi possível registrar sua inscrição.');
}

export async function cancelarInscricao(clienteId, produtoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('inscricoes').delete().eq('cliente_id', clienteId).eq('produto_id', produtoId);
  falha(error, 'Não foi possível cancelar sua inscrição.');
}

export async function admListarLancamentos() {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, tipo, previsao, inscricoes_abertas, ativo, inscricoes(criado_em, clientes(nome, email, whatsapp))')
    .eq('status', 'em_breve')
    .order('previsao', { ascending: true, nullsFirst: false });
  falha(error, 'Não foi possível carregar os lançamentos.');
  return data || [];
}

// ------------------------------------------------------------- agenda

export async function minhaAgenda(dias = 14) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('minha_agenda', { p_dias: dias });
  if (error && /minha_agenda|does not exist|schema cache/i.test(error.message)) return []; // 005 ainda não rodado
  falha(error, 'Não foi possível carregar a agenda.');
  return data || [];
}

export async function inscreverEvento(clienteId, eventoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('inscricoes_eventos').insert({ cliente_id: clienteId, evento_id: eventoId });
  if (error && !/duplicate/i.test(error.message)) falha(error, 'Não foi possível registrar sua inscrição.');
}

export async function cancelarEvento(clienteId, eventoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('inscricoes_eventos').delete().eq('cliente_id', clienteId).eq('evento_id', eventoId);
  falha(error, 'Não foi possível cancelar sua inscrição.');
}

export async function admListarEventos() {
  exigirConfiguracao();
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data, error } = await supabase
    .from('eventos')
    .select('*, inscricoes_eventos(criado_em, clientes(nome, email, whatsapp))')
    .gte('inicio', desde)
    .order('inicio');
  falha(error, 'Não foi possível carregar os eventos.');
  return data || [];
}

export async function admSalvarEvento(evento) {
  exigirConfiguracao();
  const { id, ...campos } = evento;
  const consulta = id
    ? supabase.from('eventos').update(campos).eq('id', id)
    : supabase.from('eventos').insert(campos);
  const { error } = await consulta;
  falha(error, 'Não foi possível salvar o evento.');
}

export async function clienteTemAcesso(clienteId, produtoSlug) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('cliente_tem_acesso', { p_cliente: clienteId, p_produto_slug: produtoSlug });
  falha(error, 'Não foi possível verificar o acesso.');
  return data === true;
}

// ---------------------------------------------------- dados de nascimento

export async function mapaProprio(clienteId) {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('mapas_nascimento')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('proprio', true)
    .maybeSingle();
  falha(error, 'Não foi possível carregar seus dados de nascimento.');
  return data;
}

export async function salvarMapaProprio(clienteId, dados) {
  exigirConfiguracao();
  const registro = { ...dados, cliente_id: clienteId, proprio: true };
  const existente = await mapaProprio(clienteId);
  const consulta = existente
    ? supabase.from('mapas_nascimento').update(registro).eq('id', existente.id)
    : supabase.from('mapas_nascimento').insert(registro);
  const { data, error } = await consulta.select().single();
  falha(error, 'Não foi possível salvar os dados de nascimento.');
  return data;
}

// ------------------------------------------------------------- admin

export async function admListarClientes() {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('clientes')
    .select(`id, email, nome, whatsapp, papel, user_id, criado_em,
             assinaturas(id, plano_id, status, fim, origem),
             compras(id, status, produto_id, pago_em, origem, produtos(nome)),
             mapas_nascimento(id, proprio, nome)`)
    .order('criado_em', { ascending: false });
  falha(error, 'Não foi possível carregar os clientes.');
  return data || [];
}

export async function admListarProdutos() {
  exigirConfiguracao();
  const { data, error } = await supabase.from('produtos').select('*').order('ordem');
  falha(error, 'Não foi possível carregar os produtos.');
  return data || [];
}

export async function admCriarCliente({ email, nome, whatsapp }) {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('clientes')
    .insert({ email: email.trim().toLowerCase(), nome: nome || null, whatsapp: whatsapp || null })
    .select()
    .single();
  falha(error, 'Não foi possível cadastrar o cliente.');
  return data;
}

// Motivo da liberação (gravado em "origem"): separa vendas de acessos gratuitos nos relatórios.
export const MOTIVOS_LIBERACAO = {
  pagamento: 'Pagamento',
  cofundadora: 'Equipe / cofundadora',
  divulgacao: 'Divulgação',
  doacao: 'Doação',
  cortesia: 'Cortesia'
};

export async function admTornarFundador(clienteId, origem = 'pagamento') {
  exigirConfiguracao();
  const { error } = await supabase.from('assinaturas').insert({ cliente_id: clienteId, plano_id: 'fundador', origem });
  falha(error, 'Não foi possível registrar o plano Fundador.');
}

export async function admCancelarAssinatura(assinaturaId) {
  exigirConfiguracao();
  const { error } = await supabase.from('assinaturas').update({ status: 'cancelada' }).eq('id', assinaturaId);
  falha(error, 'Não foi possível cancelar o plano.');
}

export async function admRegistrarCompra(clienteId, produtoId, valorCentavos = null, origem = 'pagamento') {
  exigirConfiguracao();
  const { error } = await supabase.from('compras').insert({ cliente_id: clienteId, produto_id: produtoId, valor_centavos: valorCentavos, origem });
  falha(error, 'Não foi possível registrar a compra.');
}

export async function admBuscarCliente(clienteId) {
  exigirConfiguracao();
  const { data, error } = await supabase.from('clientes').select('id, email, nome').eq('id', clienteId).maybeSingle();
  falha(error, 'Cliente não encontrado.');
  return data;
}

// ------------------------------------------------------------- utilidades

export function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const ESTRELA_SVG = '<svg class="estrela" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0c.9 6.6 4.4 10.6 12 12-7.6 1.4-11.1 5.4-12 12-.9-6.6-4.4-10.6-12-12C7.6 10.6 11.1 6.6 12 0Z"/></svg>';

// Ícones dos produtos (coluna "icone" da tabela produtos).
const ICONES = {
  bussola: '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="14.5" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><path d="M24 7v4M24 37v4M7 24h4M37 24h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 12l4.2 12L24 36l-4.2-12z" fill="currentColor" opacity=".9"/><path d="M24 12l4.2 12h-8.4z" fill="#1E3A5F"/><circle cx="24" cy="24" r="2" fill="#FAF8F5"/>',
  calendario: '<rect x="8" y="11" width="32" height="29" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 19h32M16 7v8M32 7v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 24l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="currentColor"/>',
  lua: '<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M36 10l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="currentColor"/>',
  mandala: '<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M24 6v36M6 24h36M11.3 11.3l25.4 25.4M36.7 11.3L11.3 36.7" stroke="currentColor" stroke-width="1" opacity=".5"/>',
  estrela: '<path d="M24 5c1.6 11.2 7.6 17.2 19 19-11.4 1.8-17.4 7.8-19 19-1.6-11.2-7.6-17.2-19-19C16.4 22.2 22.4 16.2 24 5z" fill="currentColor"/>'
};

export function iconeProduto(chave) {
  const desenho = ICONES[chave] || ICONES.estrela;
  return `<svg class="produto-icone" viewBox="0 0 48 48" aria-hidden="true">${desenho}</svg>`;
}

// Selo do Membro Fundador (estrela dourada). tamanho: 'normal' ou 'pequeno'.
export function seloFundador(tamanho = 'normal') {
  const classe = tamanho === 'pequeno' ? 'selo-fundador selo-fundador--pequeno' : 'selo-fundador';
  return `<span class="${classe}">${ESTRELA_SVG}<span>Membro <strong>Fundador</strong></span></span>`;
}

export function formatarPreco(centavos) {
  if (centavos == null) return '';
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
