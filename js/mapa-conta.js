// Liga a página do mapa (index.html#mapa) ao cadastro do cliente.
//
//   index.html?meu-mapa=1#mapa  → cliente logado. Se já tem dados salvos, vê SÓ a
//                                 interpretação do Mapa da Vida, já gerada (o
//                                 formulário, a mandala e as configurações ficam
//                                 escondidos; o PDF continua com a mandala).
//                                 Se ainda não tem dados, preenche uma única vez.
//   index.html?cliente=<id>#mapa → admin: abre/cadastra/corrige os dados de um cliente
//                                 (tela completa, como hoje).
import {
  configurado, sessaoAtual, meuCadastro, mapaProprio, salvarMapaProprio, admBuscarCliente, escapar
} from './portal.js';

const parametros = new URLSearchParams(location.search);
const modoProprio = parametros.has('meu-mapa');
const clienteAlvoId = parametros.get('cliente');
const modoFerramenta = parametros.has('ferramenta');      // ferramentas gratuitas: basta ter cadastro
const modoAdmin = parametros.has('acesso-mapas');         // tela completa antiga: só administradores
const mapa = window.entreEstrelasMapa;
const form = document.querySelector('#birth-form');
const painelGrafico = document.querySelector('#mapa .chart-panel');

const faixa = document.createElement('div');
faixa.className = 'faixa-conta';
faixa.hidden = true;
faixa.setAttribute('role', 'status');
form.before(faixa);
const avisar = (html) => { faixa.innerHTML = html; faixa.hidden = false; };

function urlEntrar() {
  return `entrar.html?voltar=${encodeURIComponent(`index.html?${parametros.toString()}${location.hash || '#mapa'}`)}`;
}

async function preencherEGerar(dados, travar) {
  const ok = await mapa.fill(dados);
  if (!ok) {
    avisar('Não conseguimos localizar a cidade salva no catálogo. Fale com a gente pelo WhatsApp para corrigir.');
    return false;
  }
  mapa.setLocked(travar);
  await mapa.render();
  return true;
}

// Visão do cliente: só a interpretação, já aberta.
async function mostrarSoInterpretacao() {
  document.body.classList.add('so-interpretacao');
  painelGrafico.prepend(faixa);
  // Espera o núcleo de cálculo (WebAssembly) para a interpretação sair do cálculo exato.
  if (window.astroWasmLoading) {
    avisar('Preparando seu Mapa da Vida…');
    await new Promise((resolve) => {
      window.addEventListener('astro-wasm-ready', resolve, { once: true });
      setTimeout(resolve, 20000); // se o núcleo falhar, não deixa a pessoa esperando para sempre
    });
    await mapa.render();
  }
  await mapa.showInterpretation();
  avisar('<a href="minha-area.html">← Voltar à minha área</a>');
  window.scrollTo({ top: 0 });
}

function salvarAoGerar(clienteId, aposSalvar) {
  form.addEventListener('submit', async () => {
    const dados = mapa.read();
    if (!dados || !dados.nome || !dados.data_nascimento || !dados.hora_nascimento) return;
    try {
      await salvarMapaProprio(clienteId, dados);
      await aposSalvar(dados);
    } catch (erro) {
      avisar(`Não foi possível salvar: ${escapar(erro.message)}`);
    }
  });
}

async function iniciar() {
  if (!configurado) return avisar('A área de clientes ainda está sendo configurada.');
  const sessao = await sessaoAtual();
  if (!sessao) {
    location.replace(urlEntrar());
    return;
  }
  const eu = await meuCadastro();
  if (!eu) return avisar('Não encontramos seu cadastro.');

  // ----- tela completa (?acesso-mapas): gera qualquer mapa. Só equipe (admin e astrólogas).
  if (modoAdmin && !clienteAlvoId && !modoProprio) {
    if (!['admin', 'astrologa'].includes(eu.papel)) location.replace('minha-area.html');
    return;
  }

  // ----- ferramentas gratuitas: o login já basta
  if (modoFerramenta && !clienteAlvoId && !modoProprio) return;

  // ----- modo admin: mapa de um cliente (tela completa)
  if (clienteAlvoId) {
    if (eu.papel !== 'admin') return avisar('Apenas administradores podem abrir o mapa de outra pessoa.');
    const cliente = await admBuscarCliente(clienteAlvoId);
    if (!cliente) return avisar('Cliente não encontrado.');
    const quem = escapar(cliente.nome || cliente.email);
    const salvo = await mapaProprio(cliente.id);
    if (salvo) {
      await preencherEGerar(salvo, false);
      avisar(`<strong>Mapa de ${quem}.</strong> Para corrigir os dados, altere e clique em "Gerar meu mapa": o cadastro será atualizado.`);
    } else {
      if (cliente.nome) document.querySelector('#name').value = cliente.nome;
      avisar(`<strong>Cadastrando os dados de nascimento de ${quem}.</strong> Preencha e clique em "Gerar meu mapa" para salvar.`);
    }
    salvarAoGerar(cliente.id, () => avisar(`<strong>Dados de ${quem} salvos.</strong> <a href="admin.html">Voltar ao painel</a>`));
    return;
  }

  // ----- modo cliente: o próprio mapa
  const salvo = await mapaProprio(eu.id);
  if (salvo) {
    if (await preencherEGerar(salvo, true)) await mostrarSoInterpretacao();
    return;
  }
  if (eu.nome) document.querySelector('#name').value = eu.nome;
  avisar('<strong>Preencha seus dados de nascimento uma única vez.</strong> Depois disso, seu Mapa da Vida aparece automaticamente sempre que você entrar. Confira bem a data, a hora e a cidade.');
  salvarAoGerar(eu.id, async () => {
    mapa.setLocked(true);
    await mapa.render();
    await mostrarSoInterpretacao();
  });
}

if (modoProprio || clienteAlvoId || modoFerramenta || modoAdmin) {
  await mapa.ready();
  iniciar().catch((erro) => avisar(`Algo deu errado: ${escapar(erro.message)}`));
}
