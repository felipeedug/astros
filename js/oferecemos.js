// "O que oferecemos" (index.html#servicos): o que já está disponível e o calendário
// do que vem pela frente, com votação aberta para priorizar (contagem pública).
// Os dados vêm da tabela produtos (a mesma de "O que vem pela frente" na Minha área).
import {
  configurado, sessaoAtual, meuCadastro, produtosAVenda, contagemVotos, meusVotos, votar, tirarVoto,
  escapar, formatarPreco, iconeProduto, imagemProduto
} from './portal.js';

// Nomes das categorias no site (troque aqui se quiser outros nomes)
const CATEGORIAS = { produto: 'Análises', vivencia: 'Vivências', live: 'Vivências', aula: 'Vivências', formacao: 'Para profissionais', ferramenta: 'Comece agora' };
const categoria = (p) => CATEGORIAS[p.tipo] || 'Análises';

const raiz = document.querySelector('[data-oferecemos]');
const jornadas = [...document.querySelectorAll('[data-jornada]')]; // linhas do tempo (Início e Membro Fundador)
let itens = [];      // a jornada: análises e vivências
let formacoes = [];  // para profissionais: formações e o software
let gratuitos = [];  // para começar: análises e ferramentas abertas
let aba = new URLSearchParams(location.search).get('aba') || 'gratuitos';
let votos = {};
let meus = new Set();
let cliente = null;
let ordem = 'data';

// Todo item tem a sua página "Conhecer" (produto.html?p=slug), com o texto da coluna pagina
const paginaDe = (p) => `produto.html?p=${encodeURIComponent(p.slug)}`;
// Data marcada = já está à venda (tem preço) ou a data está próxima: é hora de participar, não de votar
const dataMarcada = (p) => Boolean(p.preco_centavos)
  || Boolean(p.previsao && (new Date(`${p.previsao}T00:00:00`) - new Date()) / 864e5 < 45);
const entrarPara = (destino) => `entrar.html?voltar=${encodeURIComponent(destino)}`;
// Ilustração da oferta (ou nada, quando ainda não houver)
const figura = (p) => (imagemProduto(p.slug)
  ? `<img class="oferta-imagem" src="${imagemProduto(p.slug)}" alt="" decoding="async">` : '');

function quando(p) {
  if (!p.previsao) return 'Em breve';
  const data = new Date(`${p.previsao}T00:00:00`);
  const dias = (data - new Date()) / 864e5;
  // Perto: dia e mês. Longe: só o mês (a data exata ainda pode mudar).
  const texto = dias < 45
    ? data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    : data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Membros Fundadores testam antes de abrir para todos
const antesFundadores = (p) => (p.previsao_fundadores
  ? `<small class="oferta-fundadores">⭐ Membros Fundadores: ${escapar(quando({ previsao: p.previsao_fundadores }))}</small>`
  : '');

function cartaoDisponivel(p) {
  const link = paginaDe(p) || 'minha-area.html';
  return `<article class="oferta oferta--disponivel${figura(p) ? ' oferta--com-imagem' : ''}">
    <div class="oferta-icone">${figura(p) || iconeProduto(p.icone || 'estrela')}</div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${escapar(categoria(p))} · disponível</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-acoes">
        <a class="editorial-button" href="${link}">Conhecer</a>
        ${p.preco_centavos ? `<span class="oferta-preco">${formatarPreco(p.preco_centavos)} · incluído para Membros Fundadores</span>` : ''}
      </div>
    </div>
  </article>`;
}

function cartaoEmBreve(p, maximo, rotuloVoto = '★ Quero que venha primeiro') {
  const n = votos[p.id] || 0;
  const votei = meus.has(p.id);
  const pagina = paginaDe(p);
  // Data marcada (ex.: Árvore de Natal): é hora de participar, não de votar
  if (dataMarcada(p)) {
    return `<article class="oferta oferta--marcada">
    <div class="oferta-quando">${figura(p)}<span>${escapar(quando(p))}</span>${antesFundadores(p)}</div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${escapar(categoria(p))} · data marcada</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-acoes"><a class="oferta-voto" href="${pagina}">★ Quero participar</a><a class="oferta-link" href="${pagina}">Conhecer →</a></div>
    </div>
  </article>`;
  }
  const botaoVoto = votei
    ? `<button type="button" class="oferta-voto oferta-voto--feito" data-tirar-voto="${p.id}" title="Clique para tirar seu voto">✓ Você votou</button>`
    : cliente
      ? `<button type="button" class="oferta-voto" data-votar="${p.id}">${rotuloVoto}</button>`
      : `<a class="oferta-voto" href="${entrarPara(`index.html?votar=${p.slug}&aba=${aba}#servicos`)}">${rotuloVoto}</a>`;
  return `<article class="oferta">
    <div class="oferta-quando">${figura(p)}<span>${escapar(quando(p))}</span>${antesFundadores(p)}</div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${escapar(categoria(p))}</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-votos" aria-label="${n} ${n === 1 ? 'voto' : 'votos'}">
        <span class="oferta-votos-barra"><span style="width:${maximo ? Math.max(4, Math.round((n / maximo) * 100)) : 0}%"></span></span>
        <strong>${n}</strong> ${n === 1 ? 'voto' : 'votos'}
      </div>
      <div class="oferta-acoes">
        ${botaoVoto}
        <a class="oferta-link" href="${pagina}">Conhecer →</a>
      </div>
    </div>
  </article>`;
}

// A mesma jornada, de quatro jeitos (troque os textos aqui)
const ABAS = {
  gratuitos: {
    nome: 'Comece agora',
    resumo: '<strong>Comece agora, sem pagar nada.</strong> Amostras do Mapa da Vida e ferramentas abertas a todos. É só entrar com o seu e-mail.'
  },
  comunidade: {
    nome: 'Constelação',
    resumo: '<strong>Venha fazer parte desta constelação você também.</strong> A Constelação é a comunidade do Entre Estrelas: a jornada completa, com todas as análises e vivências incluídas, um novo passo por mês, e você recebe cada um antes. E você não recebe sozinho: em cada passo, a gente apresenta, ensina como aplicar na sua vida, conversa e acompanha em grupo, como ter uma astróloga do seu lado. É o jeito mais completo e o que sai mais em conta. Hoje, a forma de entrar é ser <strong>Membro Fundador</strong>.'
  },
  avulsos: {
    nome: 'Passo a passo',
    resumo: 'Prefere ir no seu ritmo? Escolha só o que faz sentido agora e pague por cada passo, quando precisar. Você recebe a sua análise completa; as conversas e o acompanhamento em grupo são da Constelação.'
  },
  profissionais: {
    nome: 'Para profissionais',
    resumo: 'Para astrólogas, terapeutas e quem atende pessoas: ofereça as análises do Entre Estrelas aos seus clientes, junto com o seu próprio atendimento, use o software no dia a dia e faça as formações. <em>Em construção: marque o que te interessa.</em>'
  }
};

const porData = (a, b) => String(a.previsao || '9999').localeCompare(String(b.previsao || '9999'));

function cartaoAvulso(p) {
  const disponivel = p.status !== 'em_breve';
  const pagina = paginaDe(p);
  const comprar = `minha-area.html?comprar=${encodeURIComponent(p.slug)}`;
  const acao = disponivel && p.preco_centavos
    ? `<a class="oferta-voto" href="${cliente ? comprar : entrarPara(comprar)}">Quero este · ${formatarPreco(p.preco_centavos)}</a>`
    : p.preco_centavos && pagina
      ? `<a class="oferta-voto" href="${pagina}">Quero participar · ${formatarPreco(p.preco_centavos)}</a>`
      : (disponivel ? '' : '<span class="oferta-preco">Valor avulso divulgado no lançamento</span>');
  return `<article class="oferta${disponivel ? ' oferta--destaque' : ''}">
    <div class="oferta-quando">${figura(p)}<span>${disponivel ? 'Disponível agora' : escapar(quando(p))}</span></div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${escapar(categoria(p))}</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-acoes">${acao}<a class="oferta-link" href="${pagina}">Conhecer →</a></div>
    </div>
  </article>`;
}

function cartaoGratuito(p, rotulo = 'Comece agora') {
  const disponivel = p.status !== 'em_breve' && p.link_acesso;
  const destino = disponivel ? (cliente ? p.link_acesso : entrarPara(p.link_acesso)) : '';
  return `<article class="oferta oferta--gratuita${figura(p) ? ' oferta--com-imagem' : ''}">
    <div class="oferta-icone">${figura(p) || iconeProduto(p.icone || 'estrela')}</div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${rotulo}${disponivel ? '' : ' · em breve'}</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-acoes">${disponivel ? `<a class="oferta-voto" href="${destino}">Experimentar</a>` : ''}${rotulo === 'Comece agora' ? `<a class="oferta-link" href="${paginaDe(p)}&presentear=1">🎁 Presentear</a>` : ''}<a class="oferta-link" href="${paginaDe(p)}">Conhecer →</a></div>
    </div>
  </article>`;
}

function conteudoComunidade() {
  const disponiveis = itens.filter((p) => p.status !== 'em_breve');
  const emBreve = itens.filter((p) => p.status === 'em_breve').sort((a, b) => (ordem === 'votos'
    ? (votos[b.id] || 0) - (votos[a.id] || 0) || porData(a, b)
    : porData(a, b)));
  const maximo = Math.max(0, ...emBreve.map((p) => votos[p.id] || 0));
  return `
    <div class="jornada-linha jornada-linha--curta" aria-label="Calendário da jornada">${htmlJornada(4)}</div>
    <div class="oferecemos-cta"><a class="editorial-button" data-abrir="apoie" href="#apoie">⭐ Seja Membro Fundador</a></div>
    ${disponiveis.length ? `<section class="oferecemos-bloco" aria-labelledby="oferecemos-agora">
      <h2 class="editorial-section-title" id="oferecemos-agora">Disponível agora</h2>
      <div class="ofertas">${disponiveis.map(cartaoDisponivel).join('')}</div>
    </section>` : ''}
    ${emBreve.length ? `<section class="oferecemos-bloco" aria-labelledby="oferecemos-proximos">
      <div class="oferecemos-cabecalho">
        <h2 class="editorial-section-title" id="oferecemos-proximos">Os próximos passos</h2>
        <div class="oferecemos-ordem" role="group" aria-label="Ordenar">
          <button type="button" data-ordem="data" aria-pressed="${ordem === 'data'}">Por data</button>
          <button type="button" data-ordem="votos" aria-pressed="${ordem === 'votos'}">Mais votados</button>
        </div>
      </div>
      <p class="oferecemos-nota">As datas são uma previsão. <strong>Vote no que você quer primeiro:</strong> os mais votados podem chegar antes.</p>
      <div class="ofertas ofertas--calendario">${emBreve.map((p) => cartaoEmBreve(p, maximo)).join('')}</div>
    </section>` : ''}`;
}

function conteudoAvulsos() {
  const lista = [...itens].sort((a, b) => (a.status === 'em_breve') - (b.status === 'em_breve') || porData(a, b));
  return `<div class="ofertas">${lista.map(cartaoAvulso).join('')}</div>`;
}

function conteudoProfissionais() {
  // Ferramentas já disponíveis (Experimentar) e, depois, o que está em construção (Tenho interesse)
  const prontas = formacoes.filter((p) => p.status !== 'em_breve');
  const emBreve = formacoes.filter((p) => p.status === 'em_breve').sort(porData);
  const maximo = Math.max(0, ...emBreve.map((p) => votos[p.id] || 0));
  const html = prontas.map((p) => cartaoGratuito(p, 'Para profissionais')).join('')
    + emBreve.map((p) => cartaoEmBreve(p, maximo, '★ Tenho interesse')).join('');
  return html ? `<div class="ofertas ofertas--calendario">${html}</div>` : '<p class="oferecemos-nota">Em construção. Em breve, aqui.</p>';
}

function conteudoGratuitos() {
  const lista = [...gratuitos].sort((a, b) => (a.status === 'em_breve') - (b.status === 'em_breve') || (a.ordem || 0) - (b.ordem || 0));
  return lista.length
    ? `<div class="ofertas ofertas--gratuitas">${lista.map((p) => cartaoGratuito(p)).join('')}</div>`
    : '<p class="oferecemos-nota">Em breve, aqui.</p>';
}

function desenhar() {
  if (!ABAS[aba]) aba = 'gratuitos';
  const conteudo = { comunidade: conteudoComunidade, avulsos: conteudoAvulsos, profissionais: conteudoProfissionais, gratuitos: conteudoGratuitos }[aba]();
  // Cor de cada catálogo: azul (jornada), roxo (profissionais), verde (para começar)
  raiz.dataset.catalogo = { comunidade: 'jornada', avulsos: 'jornada', profissionais: 'profissionais', gratuitos: 'comecar' }[aba];
  raiz.innerHTML = `
    <h2 class="oferecemos-titulo-abas">A mesma jornada, do seu jeito</h2>
    <div class="oferecemos-abas" role="tablist" aria-label="Formas de fazer a jornada">
      ${Object.entries(ABAS).map(([chave, a]) => `<button type="button" role="tab" data-aba="${chave}" aria-selected="${chave === aba}">${a.nome}</button>`).join('')}
    </div>
    <p class="oferecemos-aba-resumo">${aba === 'comunidade' && imagemProduto('constelacao')
      ? `<img class="oferecemos-aba-imagem" src="${imagemProduto('constelacao')}" alt="Comunidade Constelação">` : ''}${ABAS[aba].resumo}</p>
    ${conteudo}`;
}

// Início: a jornada em linha do tempo (o que já está disponível + os próximos, com datas)
function htmlJornada(quantos = 7) {
  const agora = itens.filter((p) => p.status !== 'em_breve');
  const proximos = itens.filter((p) => p.status === 'em_breve')
    .sort((a, b) => String(a.previsao || '9999').localeCompare(String(b.previsao || '9999')))
    .slice(0, quantos);
  const passo = (p, disponivel) => {
    const destino = paginaDe(p);
    const atributos = destino ? `href="${destino}"` : 'href="#servicos" data-abrir-oferecemos';
    return `<a class="jornada-passo${disponivel ? ' jornada-passo--agora' : ''}" ${atributos}>
      <span class="jornada-texto">
        <span class="jornada-quando">${disponivel ? 'Disponível agora' : escapar(quando(p))}</span>
        <span class="jornada-nome">${escapar(p.nome)}</span>
        <span class="jornada-cat">${escapar(categoria(p))}</span>
        ${!disponivel && p.previsao_fundadores ? `<span class="jornada-fund">⭐ Fundadores: ${escapar(quando({ previsao: p.previsao_fundadores }))}</span>` : ''}
      </span>
    </a>`;
  };
  return [...agora.map((p) => passo(p, true)), ...proximos.map((p) => passo(p, false))].join('');
}
function desenharJornada() {
  if (!jornadas.length) return;
  const html = htmlJornada();
  jornadas.forEach((j) => { j.innerHTML = html; j.hidden = !html; });
}

// Links da linha do tempo que levam para "O que oferecemos" (a navegação do site é feita pelo menu)
// Links que abrem outra página do site (a navegação do site é feita pelo menu)
document.addEventListener('click', (evento) => {
  const link = evento.target.closest('[data-abrir-oferecemos], [data-abrir]');
  if (!link) return;
  evento.preventDefault();
  document.querySelector(`.nav-link[data-view="${link.dataset.abrir || 'servicos'}"]`)?.click();
});

async function carregar() {
  if (!raiz && !jornadas.length) return;
  if (!configurado) { if (raiz) raiz.innerHTML = ''; return; }
  try {
    const sessao = await sessaoAtual();
    if (sessao) cliente = await meuCadastro().catch(() => null);
    const [todos, contagem, meusSet] = await Promise.all([
      produtosAVenda(),
      contagemVotos().catch(() => ({})),
      cliente ? meusVotos(cliente.id).catch(() => new Set()) : Promise.resolve(new Set())
    ]);
    // Só o que é oferecido às pessoas (fora ferramentas gratuitas e o próprio plano de Fundador)
    const oferecidos = todos.filter((p) => !p.concede_plano);
    // Para profissionais vem primeiro: inclui ferramentas de trabalho abertas (ex.: Caminhar dos Planetas)
    formacoes = oferecidos.filter((p) => p.tipo === 'formacao');
    gratuitos = oferecidos.filter((p) => !formacoes.includes(p) && ['aberto', 'cadastro'].includes(p.nivel));
    itens = oferecidos.filter((p) => !gratuitos.includes(p) && !formacoes.includes(p) && p.tipo !== 'ferramenta');
    votos = contagem;
    meus = meusSet;

    // Voltou do login depois de clicar em votar: registra o voto
    const params = new URLSearchParams(location.search);
    const pedido = params.get('votar');
    if (pedido && cliente) {
      const alvo = [...itens, ...formacoes].find((p) => p.slug === pedido && p.status === 'em_breve');
      if (alvo && !meus.has(alvo.id)) {
        await votar(cliente.id, alvo.id).then(() => { meus.add(alvo.id); votos[alvo.id] = (votos[alvo.id] || 0) + 1; }).catch(() => {});
      }
      params.delete('votar');
      history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`);
    }
    if (raiz) desenhar();
    desenharJornada();
  } catch (erro) {
    console.warn('O que oferecemos indisponível.', erro);
    if (raiz) raiz.innerHTML = '';
  }
}

raiz?.addEventListener('click', async (evento) => {
  const ordemBotao = evento.target.closest('[data-ordem]');
  if (ordemBotao) { ordem = ordemBotao.dataset.ordem; desenhar(); return; }
  const abaBotao = evento.target.closest('[data-aba]');
  if (abaBotao) { aba = abaBotao.dataset.aba; desenhar(); return; }
  const b = evento.target.closest('[data-votar], [data-tirar-voto]');
  if (!b || !cliente) return;
  b.disabled = true;
  try {
    if (b.dataset.votar) {
      await votar(cliente.id, b.dataset.votar);
      meus.add(b.dataset.votar);
      votos[b.dataset.votar] = (votos[b.dataset.votar] || 0) + 1;
    } else {
      await tirarVoto(cliente.id, b.dataset.tirarVoto);
      meus.delete(b.dataset.tirarVoto);
      votos[b.dataset.tirarVoto] = Math.max(0, (votos[b.dataset.tirarVoto] || 1) - 1);
    }
    desenhar();
  } catch (erro) {
    b.disabled = false;
    alert(erro.message);
  }
});

carregar();
