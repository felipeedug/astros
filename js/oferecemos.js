// "O que oferecemos" (index.html#servicos): o que já está disponível e o calendário
// do que vem pela frente, com votação aberta para priorizar (contagem pública).
// Os dados vêm da tabela produtos (a mesma de "O que vem pela frente" na Minha área).
import {
  configurado, sessaoAtual, meuCadastro, produtosAVenda, contagemVotos, meusVotos, votar, tirarVoto,
  escapar, formatarPreco, iconeProduto
} from './portal.js';

// Nomes das categorias no site (troque aqui se quiser outros nomes)
const CATEGORIAS = { produto: 'Análises', vivencia: 'Vivências', live: 'Vivências', aula: 'Vivências' };
const categoria = (p) => CATEGORIAS[p.tipo] || 'Análises';

const raiz = document.querySelector('[data-oferecemos]');
const jornadas = [...document.querySelectorAll('[data-jornada]')]; // linhas do tempo (Início e Membro Fundador)
let itens = [];
let votos = {};
let meus = new Set();
let cliente = null;
let ordem = 'data';

const paginaDe = (p) => (String(p.pagina || '').trim() ? `produto.html?p=${encodeURIComponent(p.slug)}` : '');
const entrarPara = (destino) => `entrar.html?voltar=${encodeURIComponent(destino)}`;

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
  return `<article class="oferta oferta--disponivel">
    <div class="oferta-icone">${iconeProduto(p.icone || 'estrela')}</div>
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

function cartaoEmBreve(p, maximo) {
  const n = votos[p.id] || 0;
  const votei = meus.has(p.id);
  const pagina = paginaDe(p);
  // Já tem página e data marcada (ex.: Árvore de Natal): é hora de participar, não de votar
  if (pagina) {
    return `<article class="oferta oferta--marcada">
    <div class="oferta-quando"><span>${escapar(quando(p))}</span>${antesFundadores(p)}</div>
    <div class="oferta-corpo">
      <p class="oferta-categoria">${escapar(categoria(p))} · data marcada</p>
      <h3>${escapar(p.nome)}</h3>
      <p>${escapar(p.descricao || '')}</p>
      <div class="oferta-acoes"><a class="oferta-voto" href="${pagina}">★ Quero participar</a></div>
    </div>
  </article>`;
  }
  const botaoVoto = votei
    ? `<button type="button" class="oferta-voto oferta-voto--feito" data-tirar-voto="${p.id}" title="Clique para tirar seu voto">✓ Você votou</button>`
    : cliente
      ? `<button type="button" class="oferta-voto" data-votar="${p.id}">★ Quero que venha primeiro</button>`
      : `<a class="oferta-voto" href="${entrarPara(`index.html?votar=${p.slug}#servicos`)}">★ Quero que venha primeiro</a>`;
  return `<article class="oferta">
    <div class="oferta-quando"><span>${escapar(quando(p))}</span>${antesFundadores(p)}</div>
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
        ${pagina ? `<a class="oferta-link" href="${pagina}">Ver detalhes →</a>` : ''}
      </div>
    </div>
  </article>`;
}

function desenhar() {
  const disponiveis = itens.filter((p) => p.status !== 'em_breve');
  const emBreve = itens.filter((p) => p.status === 'em_breve').sort((a, b) => (ordem === 'votos'
    ? (votos[b.id] || 0) - (votos[a.id] || 0) || String(a.previsao).localeCompare(String(b.previsao))
    : String(a.previsao || '9999').localeCompare(String(b.previsao || '9999'))));
  const maximo = Math.max(0, ...emBreve.map((p) => votos[p.id] || 0));
  raiz.innerHTML = `
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
      <p class="oferecemos-nota">Um novo passo por mês. As datas são uma previsão. <strong>Vote no que você quer primeiro:</strong> os mais votados podem chegar antes.</p>
      <div class="ofertas ofertas--calendario">${emBreve.map((p) => cartaoEmBreve(p, maximo)).join('')}</div>
    </section>` : ''}`;
}

// Início: a jornada em linha do tempo (o que já está disponível + os próximos, com datas)
function desenharJornada() {
  if (!jornadas.length) return;
  const agora = itens.filter((p) => p.status !== 'em_breve');
  const proximos = itens.filter((p) => p.status === 'em_breve')
    .sort((a, b) => String(a.previsao || '9999').localeCompare(String(b.previsao || '9999')))
    .slice(0, 7);
  const passo = (p, disponivel) => {
    const destino = paginaDe(p);
    const atributos = destino ? `href="${destino}"` : 'href="#servicos" data-abrir-oferecemos';
    return `<a class="jornada-passo${disponivel ? ' jornada-passo--agora' : ''}" ${atributos}>
      <span class="jornada-quando">${disponivel ? 'Disponível agora' : escapar(quando(p))}</span>
      <span class="jornada-nome">${escapar(p.nome)}</span>
      <span class="jornada-cat">${escapar(categoria(p))}</span>
      ${!disponivel && p.previsao_fundadores ? `<span class="jornada-fund">⭐ Fundadores: ${escapar(quando({ previsao: p.previsao_fundadores }))}</span>` : ''}
    </a>`;
  };
  const html = [...agora.map((p) => passo(p, true)), ...proximos.map((p) => passo(p, false))].join('');
  jornadas.forEach((j) => { j.innerHTML = html; j.hidden = !html; });
}

// Links da linha do tempo que levam para "O que oferecemos" (a navegação do site é feita pelo menu)
jornadas.forEach((j) => j.addEventListener('click', (evento) => {
  const link = evento.target.closest('[data-abrir-oferecemos]');
  if (!link) return;
  evento.preventDefault();
  document.querySelector('.nav-link[data-view="servicos"]')?.click();
}));

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
    itens = todos.filter((p) => !p.concede_plano && p.tipo !== 'ferramenta' && !['aberto', 'cadastro'].includes(p.nivel));
    votos = contagem;
    meus = meusSet;

    // Voltou do login depois de clicar em votar: registra o voto
    const params = new URLSearchParams(location.search);
    const pedido = params.get('votar');
    if (pedido && cliente) {
      const alvo = itens.find((p) => p.slug === pedido && p.status === 'em_breve');
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
