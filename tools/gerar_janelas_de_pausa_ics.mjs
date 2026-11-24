// Gera o calendário assinável das Janelas de Pausa (calendario/janelas-de-pausa.ics).
// As janelas são instantes universais: o arquivo usa horário UTC e cada agenda
// (Google, Outlook, Apple) mostra no fuso de quem assinou.
//
// Uso (na pasta do projeto):  node tools/gerar_janelas_de_pausa_ics.mjs [meses=24]
// Rode de novo de tempos em tempos para estender o período (ex.: a cada 6 meses).
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const meses = Number(process.argv[2]) || 24;

const { default: criarNucleo } = await import(pathToFileURL(join(raiz, 'wasm', 'astro_legacy_wasm_v11_node.js')).href);
const nucleo = await criarNucleo({ locateFile: (arquivo) => join(raiz, 'wasm', arquivo) });

const paraData = (jd) => new Date(Math.round((jd - 2440587.5) * 86400) * 1000);
const utc = (data) => data.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
// Linhas do .ics: no máximo 75 bytes, continuação começa com espaço
const dobrar = (linha) => {
  const partes = [];
  let atual = '';
  for (const caractere of linha) {
    if (Buffer.byteLength(atual + caractere) > 73) { partes.push(atual); atual = ' '; }
    atual += caractere;
  }
  partes.push(atual);
  return partes.join('\r\n');
};
const escaparTexto = (texto) => texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

const hoje = new Date();
let ano = hoje.getUTCFullYear();
let mes = hoje.getUTCMonth() + 1;
const vistos = new Map();
for (let i = 0; i < meses; i += 1) {
  const dados = JSON.parse(nucleo.voidMoonApi(ano, mes, 0));
  dados.periods.forEach((p) => vistos.set(Math.round(p.startJd * 1440), p)); // sem repetir entre meses
  mes += 1;
  if (mes > 12) { mes = 1; ano += 1; }
}
const janelas = [...vistos.values()].sort((a, b) => a.startJd - b.startJd);

const agora = utc(new Date());
const descricao = escaparTexto('Momento de pausar: evite começar algo novo ou tomar decisões importantes. '
  + 'Bom para descansar, treinar e terminar o que já está em andamento.\nEntre Estrelas · entreestrelas.com');
const linhas = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Entre Estrelas//Janelas de Pausa//PT-BR',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'X-WR-CALNAME:Janelas de Pausa · Entre Estrelas',
  `X-WR-CALDESC:${escaparTexto('Os momentos de pausa, a cada dois ou três dias. Entre Estrelas.')}`,
  'X-PUBLISHED-TTL:PT12H',
  'REFRESH-INTERVAL;VALUE=DURATION:PT12H'
];
janelas.forEach((p) => {
  const inicio = paraData(p.startJd);
  const fim = paraData(p.endJd);
  linhas.push(
    'BEGIN:VEVENT',
    `UID:janela-${utc(inicio)}@entreestrelas.com`,
    `DTSTAMP:${agora}`,
    `DTSTART:${utc(inicio)}`,
    `DTEND:${utc(fim)}`,
    'SUMMARY:Janela de Pausa',
    `DESCRIPTION:${descricao}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT'
  );
});
linhas.push('END:VCALENDAR');

mkdirSync(join(raiz, 'calendario'), { recursive: true });
writeFileSync(join(raiz, 'calendario', 'janelas-de-pausa.ics'), linhas.map(dobrar).join('\r\n') + '\r\n');
console.log(`${janelas.length} janelas de ${utc(paraData(janelas[0].startJd))} a ${utc(paraData(janelas.at(-1).endJd))}`);
