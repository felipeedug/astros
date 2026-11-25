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
    .select('id, email, nome, whatsapp, papel, aceita_novidades, origem, parceiro')
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

// ------------------------------------------------------------------ indicações
// Link de parceira: qualquer página com ?indicacao=CODIGO guarda o código no navegador;
// quando a pessoa entra, a Minha área associa a indicação (só na primeira vez).
const CHAVE_INDICACAO = 'ee-indicacao';
try {
  const codigoNoLink = new URLSearchParams(location.search).get('indicacao');
  if (codigoNoLink && /^[\w-]{2,40}$/.test(codigoNoLink)) localStorage.setItem(CHAVE_INDICACAO, codigoNoLink);
} catch { /* navegador sem localStorage */ }

export async function registrarIndicacaoPendente() {
  let codigo = null;
  try { codigo = localStorage.getItem(CHAVE_INDICACAO); } catch { return; }
  if (!codigo || !configurado) return;
  const { data, error } = await supabase.rpc('registrar_indicacao', { p_codigo: codigo });
  if (!error && data !== 'entre_primeiro') localStorage.removeItem(CHAVE_INDICACAO);
}

export function linkDeIndicacao(codigo) {
  return urlDoSite(`./?indicacao=${encodeURIComponent(codigo)}`);
}

export async function admDefinirIndicacao(clienteId, indicadoPor) {
  exigirConfiguracao();
  const { error } = await supabase.from('clientes').update({ indicado_por: indicadoPor || null }).eq('id', clienteId);
  falha(error, 'Não foi possível salvar a indicação.');
}

// ------------------------------------------------------------------ aniversariantes (equipe)
export async function aniversariantesDoMes(mes = null) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('aniversariantes_do_mes', { p_mes: mes });
  falha(error, 'Não foi possível carregar os aniversariantes.');
  return data || [];
}

// Lista pronta para mostrar: hoje em destaque, próximos dias, e quem já fez aniversário no mês.
export function htmlAniversariantes(lista, assinatura = 'Felipe e Mara, do Entre Estrelas') {
  if (!lista.length) return '<p class="suave">Ninguém com aniversário cadastrado neste mês.</p>';
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const linha = (p) => {
    const [ano, mes, dia] = p.data_nascimento.split('-').map(Number);
    const primeiro = (p.nome || '').split(' ')[0];
    const numero = String(p.whatsapp || '').replace(/\D/g, '');
    const fone = numero.length >= 10 && numero.length <= 11 ? `55${numero}` : numero;
    const texto = encodeURIComponent(`${primeiro}, feliz aniversário! ★ Hoje o Sol volta ao ponto exato do céu em que você nasceu, e a gente quis estar presente nesse momento. Que seu novo ciclo seja lindo! Com carinho, ${assinatura} 💛`);
    const quando = dia === diaHoje ? 'hoje' : dia < diaHoje ? 'passou' : 'vem';
    return `<li class="aniversario-item aniversario-item--${quando}">
      <span class="aniversario-dia">${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}</span>
      <span class="aniversario-nome"><strong>${escapar(p.nome || p.email)}</strong>${p.fundador ? ' ★' : ''}
        ${quando === 'hoje' ? '<span class="suave"> · <strong>é hoje! 🎂</strong></span>' : ''}${p.madrinha ? `<br><span class="suave" style="font-size:.82rem">madrinha: ${escapar(p.madrinha)}</span>` : ''}</span>
      ${fone ? `<a class="botao botao-leve botao-pequeno" href="https://wa.me/${fone}?text=${texto}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : '<span class="suave" style="font-size:.8rem">sem WhatsApp</span>'}
    </li>`;
  };
  return `<ul class="lista-aniversarios">${lista.map(linha).join('')}</ul>`;
}

// Aniversariantes do mês para toda a comunidade: só nome e dia (sem ano, sem contato)
export async function aniversariantesDaComunidade(mes = null) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('aniversariantes_da_comunidade', { p_mes: mes });
  if (error && /aniversariantes_da_comunidade|does not exist|schema cache/i.test(error.message)) return [];
  falha(error, 'Não foi possível carregar os aniversariantes.');
  return data || [];
}
// Membros Fundadores no "Quem somos": só primeiro nome e último sobrenome (supabase/030)
export async function fundadoresPublicos() {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('fundadores_publicos');
  if (error && /fundadores_publicos|does not exist|schema cache/i.test(error.message)) return [];
  falha(error, 'Não foi possível carregar os Membros Fundadores.');
  return (data || []).map((l) => l.nome).filter(Boolean);
}
export function htmlAniversariantesComunidade(lista) {
  const diaHoje = new Date().getDate();
  return `<ul class="lista-aniversarios">${lista.map((p) => {
    const quando = p.dia === diaHoje ? 'hoje' : p.dia < diaHoje ? 'passou' : 'vem';
    return `<li class="aniversario-item aniversario-item--${quando}">
      <span class="aniversario-dia">${String(p.dia).padStart(2, '0')}/${String(p.mes).padStart(2, '0')}</span>
      <span class="aniversario-nome"><strong>${escapar(p.nome || '')}</strong>${p.fundador ? ' ★' : ''}${quando === 'hoje' ? '<span class="suave"> · <strong>é hoje! 🎂</strong></span>' : ''}</span>
    </li>`;
  }).join('')}</ul>`;
}

// Repasses pagos às parceiras (só admin)
export async function admRegistrarRepasse(parceiroId, valorCentavos, pagoEm, observacao) {
  exigirConfiguracao();
  const { error } = await supabase.from('repasses')
    .insert({ parceiro_id: parceiroId, valor_centavos: valorCentavos, pago_em: pagoEm, observacao: observacao || null });
  falha(error, 'Não foi possível registrar o repasse.');
}

export async function admExcluirRepasse(id) {
  exigirConfiguracao();
  const { error } = await supabase.from('repasses').delete().eq('id', id);
  falha(error, 'Não foi possível excluir o repasse.');
}

// Admin envia para a pessoa o e-mail de acesso (link + código), o mesmo da tela de entrar.
// Não mexe na sessão de quem está no Painel.
export async function admEnviarAcesso(email) {
  exigirConfiguracao();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: urlDoSite('minha-area.html'), shouldCreateUser: true, data: { origem: 'painel' } }
  });
  falha(error, 'Não foi possível enviar o e-mail de acesso.');
}

// Admin completa o cadastro de qualquer pessoa (nome, WhatsApp, papel e observações)
export async function admEditarCliente(clienteId, { nome, whatsapp, papel, observacoes, indicado_por, parceiro, codigo_indicacao, valor_fundador_centavos }) {
  exigirConfiguracao();
  const { error } = await supabase.from('clientes')
    .update({ nome: nome || null, whatsapp: whatsapp || null, papel, observacoes: observacoes || null,
              indicado_por: indicado_por || null, parceiro: Boolean(parceiro), codigo_indicacao: codigo_indicacao || null,
              valor_fundador_centavos: Number.isInteger(valor_fundador_centavos) ? valor_fundador_centavos : null })
    .eq('id', clienteId);
  falha(error, 'Não foi possível salvar o cadastro.');
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

// ------------------------------------------------------------- compras e presentes

// Produtos à venda (preços para mostrar; o preço final é sempre calculado no servidor)
export async function produtosAVenda() {
  exigirConfiguracao();
  const { data, error } = await supabase.from('produtos')
    .select('*')
    .eq('ativo', true);
  falha(error, 'Não foi possível carregar as opções.');
  return data || [];
}

// ------------------------------------------------------------- votos ("O que oferecemos")
// Contagem pública (votos do formulário + do site), por produto_id
export async function contagemVotos() {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('contagem_votos');
  falha(error, 'Não foi possível carregar os votos.');
  return Object.fromEntries((data || []).map((v) => [v.produto_id, v.votos]));
}
export async function meusVotos(clienteId) {
  exigirConfiguracao();
  const { data, error } = await supabase.from('votos').select('produto_id').eq('cliente_id', clienteId);
  falha(error, 'Não foi possível carregar seus votos.');
  return new Set((data || []).map((v) => v.produto_id));
}
export async function votar(clienteId, produtoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('votos').insert({ cliente_id: clienteId, produto_id: produtoId });
  if (error && !/duplicate|unique/i.test(error.message || '')) falha(error, 'Não foi possível registrar seu voto.');
}
export async function tirarVoto(clienteId, produtoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('votos').delete().eq('cliente_id', clienteId).eq('produto_id', produtoId);
  falha(error, 'Não foi possível tirar seu voto.');
}

// Um produto, para a página de divulgação (produto.html?p=slug). Aberta a todos.
export async function produtoDaPagina(slug) {
  exigirConfiguracao();
  const { data, error } = await supabase.from('produtos')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle();
  falha(error, 'Não foi possível carregar esta página.');
  return data;
}

// Texto da página do produto, num jeito simples de escrever:
// "## Título", "- item", "> destaque", "**negrito**" e linha em branco entre parágrafos.
export function textoDaPagina(texto) {
  const enfeitar = (linha) => escapar(linha).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return String(texto || '').replace(/\r\n/g, '\n').trim().split(/\n\s*\n/).map((bloco) => {
    const linhas = bloco.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!linhas.length) return '';
    if (linhas.length === 1 && linhas[0].startsWith('## ')) return `<h2>${enfeitar(linhas[0].slice(3))}</h2>`;
    if (linhas.every((l) => l.startsWith('- '))) return `<ul>${linhas.map((l) => `<li>${enfeitar(l.slice(2))}</li>`).join('')}</ul>`;
    if (linhas.every((l) => l.startsWith('> '))) return `<blockquote>${linhas.map((l) => enfeitar(l.slice(2))).join(' ')}</blockquote>`;
    return `<p>${linhas.map(enfeitar).join(' ')}</p>`;
  }).join('\n');
}

// Cria o pagamento na InfinitePay e leva a pessoa para pagar. itens: [{ slug, presente }]
export async function irParaPagamento(itens) {
  exigirConfiguracao();
  // O "passe" do login vale 1 hora e o celular pausa a renovação com a aba em segundo plano.
  // Antes de pagar, renova o passe; se o servidor ainda recusar, tenta uma vez com um passe novo.
  // Só se a sessão tiver acabado de verdade, leva para entrar e volta para este mesmo pedido.
  const voltarAoPedido = () => {
    const primeiro = itens[0] || {};
    const destino = `minha-area.html?${primeiro.presente ? 'presentear' : 'comprar'}=${encodeURIComponent(primeiro.slug || '')}`;
    window.location.href = `entrar.html?voltar=${encodeURIComponent(destino)}`;
    return new Promise(() => {}); // a página vai mudar: não mostra erro
  };
  const chamar = (sessao) => supabase.functions.invoke('criar-pagamento', {
    body: { itens }, headers: { Authorization: `Bearer ${sessao.access_token}` }
  });
  let { data: { session } } = await supabase.auth.getSession(); // renova sozinho se o passe venceu
  if (!session) return voltarAoPedido();
  let { data, error } = await chamar(session);
  if (error?.context?.status === 401) {
    ({ data: { session } } = await supabase.auth.refreshSession());
    if (!session) return voltarAoPedido();
    ({ data, error } = await chamar(session));
    if (error?.context?.status === 401) return voltarAoPedido();
  }
  if (error || !data?.url) {
    let mensagem = 'Não foi possível iniciar o pagamento. Tente de novo em instantes.';
    try { mensagem = (await error.context.json()).erro || mensagem; } catch { /* mantém a padrão */ }
    throw new Error(mensagem);
  }
  window.location.href = data.url;
}

// Compra sem login: só o e-mail de quem compra. A compra fica guardada nesse e-mail
// e aparece na Minha área quando a pessoa entrar com ele.
// comprador: { email, nome, aceita_novidades }
export async function comprarSemLogin(itens, comprador) {
  exigirConfiguracao();
  let indicacao = '';
  try { indicacao = localStorage.getItem(CHAVE_INDICACAO) || ''; } catch { /* sem localStorage */ }
  const { data, error } = await supabase.functions.invoke('criar-pagamento', {
    body: { itens, comprador: { ...comprador, indicacao } }
  });
  if (error || !data?.url) {
    let mensagem = 'Não foi possível iniciar o pagamento. Tente de novo em instantes.';
    try { mensagem = (await error.context.json()).erro || mensagem; } catch { /* mantém a padrão */ }
    throw new Error(mensagem);
  }
  try { localStorage.setItem('ee-email-compra', comprador.email.trim().toLowerCase()); } catch { /* ok */ }
  window.location.href = data.url;
}

// Confirma o pagamento na volta da InfinitePay (caso o aviso automático atrase)
export async function confirmarPagamento(dados) {
  exigirConfiguracao();
  const { data } = await supabase.functions.invoke('aviso-infinitepay', { body: dados });
  return data || {};
}

export async function meusPresentes() {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('meus_presentes');
  if (error && /meus_presentes|does not exist|schema cache/i.test(error.message)) return [];
  falha(error, 'Não foi possível carregar seus presentes.');
  return data || [];
}

export async function verPresente(codigo) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('ver_presente', { p_codigo: codigo });
  falha(error, 'Não foi possível abrir o presente.');
  return (data || [])[0] || null;
}

// O que a pessoa já abriu (vai para a Minha jornada). Nunca atrapalha o clique.
export async function registrarAcesso(slug) {
  try { if (supabase && slug) await supabase.rpc('registrar_acesso', { p_slug: slug }); } catch { /* 029 ainda não rodado */ }
}

// Clique em "Acessar"/"Experimentar": registra e só então abre (no máximo 0,8 s de espera)
export function acessarRegistrando(evento, el) {
  const slug = el?.dataset?.acesso;
  if (!slug) return;
  const href = el.getAttribute('href');
  if (!href || el.target === '_blank' || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.button) {
    registrarAcesso(slug);
    return;
  }
  evento.preventDefault();
  Promise.race([registrarAcesso(slug), new Promise((r) => setTimeout(r, 800))])
    .then(() => { window.location.href = href; });
}

export async function meusAcessos() {
  try {
    const { data, error } = await supabase.from('acessos_conteudo').select('produto_id, ultimo_em');
    if (error) return new Map();
    return new Map((data || []).map((a) => [a.produto_id, a.ultimo_em]));
  } catch { return new Map(); }
}

// Presente sem pagamento dos conteúdos abertos (Comece agora): devolve o código do link
export async function presentearGratis(slug) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('presentear_gratis', { p_slug: slug });
  falha(error, 'Não foi possível gerar o presente.');
  return data;
}

export async function resgatarPresente(codigo) {
  exigirConfiguracao();
  const { data, error } = await supabase.rpc('resgatar_presente', { p_codigo: codigo });
  falha(error, 'Não foi possível receber o presente.');
  return data;
}

// Link temporário (5 min) para baixar um arquivo comprado (ex.: livro em PDF)
export async function linkDoArquivo(caminho) {
  exigirConfiguracao();
  const { data, error } = await supabase.storage.from('arquivos').createSignedUrl(caminho, 300, { download: true });
  falha(error, 'Não foi possível preparar o download.');
  return data.signedUrl;
}

export function linkDePresente(codigo) {
  return urlDoSite(`presente.html?c=${encodeURIComponent(codigo)}`);
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

// Exclui o evento de vez (as inscrições dele também são apagadas).
export async function admExcluirEvento(eventoId) {
  exigirConfiguracao();
  const { error } = await supabase.from('eventos').delete().eq('id', eventoId);
  falha(error, 'Não foi possível excluir o evento.');
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
  // Cadastro sem nome (ex.: comprou direto pelo site): usa o nome do próprio mapa
  if (dados.nome) {
    await supabase.from('clientes').update({ nome: dados.nome }).eq('id', clienteId).is('nome', null);
  }
  return data;
}

// ------------------------------------------------------------- admin

export async function admListarClientes() {
  exigirConfiguracao();
  const { data, error } = await supabase
    .from('clientes')
    .select(`id, email, nome, whatsapp, papel, observacoes, user_id, criado_em, indicado_por, parceiro, codigo_indicacao, valor_fundador_centavos,
             repasses(id, valor_centavos, pago_em, observacao),
             assinaturas(id, plano_id, status, fim, origem, referencia_externa),
             compras(id, status, produto_id, pago_em, origem, valor_centavos, referencia_externa, produtos(nome)),
             pedidos(id, status, total_centavos, valor_pago_centavos, itens, forma_pagamento),
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

const ESTRELA_SVG = '<svg class="estrela" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" d="M12 2.6l2.75 5.9 6.45.75-4.75 4.45 1.25 6.4L12 17l-5.7 3.1 1.25-6.4L2.8 9.25l6.45-.75z"/></svg>';

// Ícones dos produtos (coluna "icone" da tabela produtos).
const ICONES = {
  bussola: '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="14.5" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><path d="M24 7v4M24 37v4M7 24h4M37 24h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 12l4.2 12L24 36l-4.2-12z" fill="currentColor" opacity=".9"/><path d="M24 12l4.2 12h-8.4z" fill="#1E3A5F"/><circle cx="24" cy="24" r="2" fill="#FAF8F5"/>',
  calendario: '<rect x="8" y="11" width="32" height="29" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 19h32M16 7v8M32 7v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 24l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="currentColor"/>',
  lua: '<path d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" d="M36.5 8.5l1.4 2.9 3.2.4-2.3 2.2.6 3.1-2.9-1.6-2.9 1.6.6-3.1-2.3-2.2 3.2-.4z"/>',
  mandala: '<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M24 6v36M6 24h36M11.3 11.3l25.4 25.4M36.7 11.3L11.3 36.7" stroke="currentColor" stroke-width="1" opacity=".5"/>',
  livro: '<path d="M8 10c5-2 11-2 16 1 5-3 11-3 16-1v27c-5-2-11-2-16 1-5-3-11-3-16-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 11v27" stroke="currentColor" stroke-width="2"/>',
  presente: '<rect x="8" y="18" width="32" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 13h36v6H6zM24 13v27" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M24 13c-3-6-10-6-10-2s7 2 10 2c3 0 10 2 10-2s-7-4-10 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  estrela: '<path fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" d="M24 6l5.5 11.8 12.9 1.5-9.5 8.9 2.5 12.8L24 34.6l-11.4 6.4 2.5-12.8-9.5-8.9 12.9-1.5z"/>'
};

// Ilustração de cada oferta (images/ofertas/<slug>.webp). Para incluir uma nova,
// salve o arquivo com o slug como nome e acrescente o slug aqui.
const COM_IMAGEM = new Set([
  'mapa-da-vida', 'mapa-infantil', 'membro-fundador', 'compatibilidade', 'mapa-do-ano', 'natal-2026',
  'periodos-propicios', 'mudancas-no-trabalho', 'talisma', 'quem-voce-e', 'como-voce-ama', 'constelacao', 'horas-de-acompanhamento',
  'formacao-astrologia', 'software-astrologas', 'boas-vindas-e-proximos-passos', 'carreira-e-trabalho',
  'efemerides', 'lua-fora-de-curso', 'mapa-da-vida-resumido'
]);
// Lives e encontros usam o título como nome (ex.: "Boas Vindas e Próximos Passos")
const MESMA_IMAGEM = { 'arvore-de-natal-com-raizes': 'natal-2026' };
export const slugDe = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function imagemProduto(slug) {
  const chave = MESMA_IMAGEM[slug] || slug;
  return COM_IMAGEM.has(chave) ? `images/ofertas/${chave}.webp` : '';
}
// Versão leve (320 px) para listas e cards. Gerada por tools/gerar_miniaturas.ps1
export function miniaturaProduto(slug) {
  const chave = MESMA_IMAGEM[slug] || slug;
  return COM_IMAGEM.has(chave) ? `images/ofertas/mini/${chave}.jpg` : '';
}

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
