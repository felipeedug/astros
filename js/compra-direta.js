// Compra direta: "Quero ser Membro Fundador" e os botões de compra das páginas de produto
// (data-compra-direta="slug", data-presente="1", data-nome, data-preco) vão direto ao pagamento.
// Quem já entrou no site segue para a Minha área (que abre o pedido na hora).
// Quem não entrou só digita o e-mail aqui mesmo: sem link, sem código.
// import * : se o navegador ainda tiver a cópia antiga do portal.js, o botão segue o caminho antigo
import * as portal from './portal.js';

const FUNDADOR = 'membro-fundador';
const SELETOR = `[data-compra-direta], [data-founder-checkout], a[href*="comprar=${FUNDADOR}"]`;
let pedido = { slug: FUNDADOR, presente: false };
let linkAtual = null;

const estilo = `
.compra-direta { width:min(440px,94vw); padding:28px 26px 24px; border:0; border-radius:4px; color:#1A1F2E;
  background:#FAF8F5; font-family:'Montserrat',sans-serif; box-shadow:0 24px 60px rgba(13,27,42,.35); max-height:94vh; overflow-x:hidden; overflow-y:auto; }
.compra-direta::backdrop { background:rgba(13,27,42,.6); }
.compra-direta h2 { margin:0 0 6px; color:#1E3A5F; font:700 24px/1.25 'Playfair Display',serif; }
.compra-direta .cd-preco { margin:0 0 18px; color:#5A6270; font-size:15px; line-height:1.5; }
.compra-direta label { display:block; margin:0 0 12px; color:#1E3A5F; font-size:13px; font-weight:600; }
.compra-direta input[type=email], .compra-direta input[type=text] { display:block; width:100%; box-sizing:border-box;
  margin-top:5px; padding:12px 13px; border:1px solid #C9C4BC; border-radius:3px; background:#fff; font:400 16px 'Montserrat',sans-serif; }
.compra-direta input:focus { outline:2px solid #C9A227; outline-offset:1px; border-color:#C9A227; }
.compra-direta label, .compra-direta label * { text-transform:none; letter-spacing:normal; }
.compra-direta .cd-check input { width:auto; min-height:0; flex:none; }
.compra-direta .cd-check span { font-size:13px; line-height:1.5; }
.compra-direta .cd-check { display:flex; gap:8px; align-items:flex-start; font-weight:400; color:#5A6270; }
.compra-direta .cd-check input { margin-top:3px; }
.compra-direta .cd-pagar { width:100%; min-height:50px; margin-top:6px; border:0; border-radius:3px; color:#0D1B2A;
  background:#F0C75E; font:700 15px 'Montserrat',sans-serif; cursor:pointer; }
.compra-direta .cd-pagar:hover { background:#E5B843; }
.compra-direta .cd-pagar:disabled { opacity:.6; cursor:wait; }
.compra-direta .cd-nota { margin:12px 0 0; color:#5A6270; font-size:12.5px; line-height:1.55; }
.compra-direta .cd-erro { margin:10px 0 0; color:#A33A2B; font-size:14px; }
.compra-direta .cd-fechar { position:absolute; top:10px; right:12px; border:0; background:none; color:#5A6270;
  font-size:26px; line-height:1; cursor:pointer; }
`;

let dialogo = null;

function montar() {
  if (dialogo) return dialogo;
  const css = document.createElement('style');
  css.textContent = estilo;
  document.head.append(css);
  dialogo = document.createElement('dialog');
  dialogo.className = 'compra-direta';
  dialogo.setAttribute('aria-labelledby', 'cd-titulo');
  dialogo.innerHTML = `
    <button type="button" class="cd-fechar" aria-label="Fechar">×</button>
    <form>
      <h2 id="cd-titulo"></h2>
      <p class="cd-preco"></p>
      <label>Seu e-mail
        <input name="email" type="email" autocomplete="email" placeholder="seu@email.com" required>
      </label>
      <label>Seu nome <span style="font-weight:400">(opcional)</span>
        <input name="nome" type="text" autocomplete="name">
      </label>
      <label class="cd-check"><input name="novidades" type="checkbox" checked>
        <span>Quero receber novidades e conteúdos do Entre Estrelas.</span></label>
      <button class="cd-pagar" type="submit">Ir para o pagamento</button>
      <p class="cd-erro" role="alert" hidden></p>
      <p class="cd-nota"></p>
    </form>`;
  document.body.append(dialogo);
  const form = dialogo.querySelector('form');
  const erro = dialogo.querySelector('.cd-erro');
  const botao = dialogo.querySelector('.cd-pagar');
  dialogo.querySelector('.cd-fechar').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erro.hidden = true;
    botao.disabled = true;
    botao.textContent = 'Abrindo o pagamento…';
    try {
      await portal.comprarSemLogin([pedido], {
        email: form.email.value,
        nome: form.nome.value,
        aceita_novidades: form.novidades.checked
      });
    } catch (e) {
      // Servidor ainda sem a compra de presente sem login: segue o caminho antigo (entrar)
      if (pedido.presente && /entre na sua área/i.test(e.message) && linkAtual) { window.location.href = linkAtual.href; return; }
      erro.textContent = e.message;
      erro.hidden = false;
      botao.disabled = false;
      botao.textContent = 'Ir para o pagamento';
    }
  });
  return dialogo;
}

document.addEventListener('click', async (evento) => {
  const link = evento.target.closest(SELETOR);
  if (!link || !portal.configurado || !portal.comprarSemLogin || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
  evento.preventDefault();
  // Já entrou: a Minha área abre o pedido direto (com preço de membro, se houver)
  if (await portal.sessaoAtual().catch(() => null)) { window.location.href = link.href; return; }
  let email = '';
  try { email = localStorage.getItem('ee-email-compra') || ''; } catch { /* ok */ }
  const d = montar();
  const slug = link.dataset.compraDireta || FUNDADOR;
  const presente = link.dataset.presente === '1';
  pedido = { slug, presente };
  linkAtual = link;
  const fundador = slug === FUNDADOR;
  d.querySelector('#cd-titulo').textContent = fundador ? '⭐ Membro Fundador'
    : `${presente ? '🎁 Presente: ' : ''}${link.dataset.nome || 'Sua compra'}`;
  d.querySelector('.cd-preco').textContent = fundador ? 'R$ 49,85, valor único. Pix ou cartão.'
    : `${link.dataset.preco ? `${link.dataset.preco}. ` : ''}Pix ou cartão.`;
  d.querySelector('.cd-nota').textContent = presente
    ? 'Depois de pagar, entre no site com este mesmo e-mail: o link do presente para enviar estará em Minha área → Meus presentes.'
    : `Depois de pagar, é só entrar no site com este mesmo e-mail: ${fundador ? 'o seu acesso de Membro Fundador' : 'a sua compra'} já vai estar lá.`;
  d.querySelector('.cd-erro').hidden = true;
  if (email && !d.querySelector('[name=email]').value) d.querySelector('[name=email]').value = email;
  d.showModal();
  d.querySelector('[name=email]').focus();
});
