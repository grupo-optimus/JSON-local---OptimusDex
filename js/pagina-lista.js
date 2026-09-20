/* SEÇÃO 1 — ELEMENTOS DO HTML: referências aos elementos da tela por id */
const listaEl        = document.getElementById('lista-pokemons');
const carregandoEl   = document.getElementById('estado-carregando');
const erroEl         = document.getElementById('estado-erro');
const mensagemErroEl = document.getElementById('mensagem-erro');
const vazioEl        = document.getElementById('sem-resultado');

const paginacaoEl    = document.getElementById('paginacao');
const infoPaginaEl   = document.getElementById('info-pagina');
const botaoAnterior  = document.getElementById('btn-anterior');
const botaoProxima   = document.getElementById('btn-proxima');

const formBusca      = document.getElementById('form-busca');
const campoBusca     = document.getElementById('busca');
const botaoTentar    = document.getElementById('btn-tentar');

const botaoFiltros   = document.getElementById('btn-filtros');
const painelFiltros  = document.getElementById('painel-filtros');
const caixaTipos     = document.getElementById('filtro-tipos');
const caixaRegioes   = document.getElementById('filtro-regioes');
const caixaCategorias= document.getElementById('filtro-categorias');
const avisoFiltroEl  = document.getElementById('aviso-filtro');
const botaoAplicar   = document.getElementById('btn-aplicar-filtros');
const botaoLimpar    = document.getElementById('btn-limpar-filtros');

/* SEÇÃO 2 — VARIÁVEIS DE ESTADO: página, busca, filtros e última ação */
let paginaAtual = 1;
let termoAtual = '';
let filtros = { tipos: [], regiao: null, categoria: null };
let idsFiltrados = null;
let ultimaAcao = null;

/* SEÇÃO 3 — ESTADOS E LISTA: estados da tela, desenho dos cards e verificação de filtro */
function definirEstado(estado, mensagem) {
  mostrar(carregandoEl, estado === 'carregando');
  mostrar(erroEl,       estado === 'erro');
  mostrar(vazioEl,      estado === 'vazio');
  mostrar(listaEl,      estado === 'pronto');
  mostrar(paginacaoEl,  estado === 'pronto' && termoAtual === '');
  if (mensagem) mensagemErroEl.textContent = mensagem;
}

function desenharLista(pokemons) {
  listaEl.replaceChildren();
  pokemons.forEach(p => listaEl.appendChild(criarCardPokemon(p, { comBotaoFavorito: true })));
  atualizarLinksComparacao();
}

function temFiltro() {
  return filtros.tipos.length > 0 || filtros.regiao !== null || filtros.categoria !== null;
}

/* SEÇÃO 4 — ESTADO NA URL: escrever e ler busca, filtros e página no endereço */
function sincronizarURL() {
  const partes = new URLSearchParams();

  if (termoAtual)          partes.set('q', termoAtual);
  if (filtros.tipos.length) partes.set('tipo', filtros.tipos.join(','));
  if (filtros.regiao)      partes.set('regiao', filtros.regiao);
  if (filtros.categoria)   partes.set('categoria', filtros.categoria);
  if (paginaAtual > 1)     partes.set('pagina', paginaAtual);

  const consulta = partes.toString();
  window.history.replaceState(null, '', consulta ? '?' + consulta : window.location.pathname);

  guardarUltimaLista(window.location.href);
}

function lerURL() {
  const partes = new URLSearchParams(window.location.search);

  termoAtual        = partes.get('q') || '';
  filtros.tipos     = (partes.get('tipo') || '').split(',').filter(Boolean);
  filtros.regiao    = partes.get('regiao') ? Number(partes.get('regiao')) : null;
  filtros.categoria = partes.get('categoria') || null;
  paginaAtual       = Math.max(1, Number(partes.get('pagina')) || 1);
}

/* SEÇÃO 5 — CARREGAR PÁGINA: carregarPagina com ou sem filtro */
async function carregarPagina(pagina) {
  ultimaAcao = () => carregarPagina(pagina);
  definirEstado('carregando');

  try {
    let itens;
    let totalPaginas;

    if (idsFiltrados) {
      totalPaginas = Math.max(1, Math.ceil(idsFiltrados.length / TAMANHO_PAGINA));
      const inicio = (pagina - 1) * TAMANHO_PAGINA;
      itens = await obterVariosPokemons(idsFiltrados.slice(inicio, inicio + TAMANHO_PAGINA));
    } else {
      const resultado = await listarPagina(pagina);
      itens = resultado.itens;
      totalPaginas = resultado.totalPaginas;
    }

    paginaAtual = pagina;
    desenharLista(itens);

    infoPaginaEl.textContent = 'Página ' + pagina + ' de ' + totalPaginas;
    botaoAnterior.disabled = pagina <= 1;
    botaoProxima.disabled  = pagina >= totalPaginas;

    sincronizarURL();
    definirEstado('pronto');
  } catch (erro) {
    definirEstado('erro', erro.message);
  }
}

/* SEÇÃO 6 — BUSCA: fazerBusca por nome ou número */
async function fazerBusca(termo) {
  ultimaAcao = () => fazerBusca(termo);

  termoAtual = termo;
  idsFiltrados = null;
  filtros = { tipos: [], regiao: null, categoria: null };
  paginaAtual = 1;
  pintarChips();

  definirEstado('carregando');

  try {
    const achados = await buscarPokemons(termo);
    sincronizarURL();

    if (achados.length === 0) {
      definirEstado('vazio');
      return;
    }

    desenharLista(achados);
    definirEstado('pronto');
  } catch (erro) {
    if (erro.message === 'Pokémon não encontrado.') {
      definirEstado('vazio');
      return;
    }
    definirEstado('erro', erro.message);
  }
}

/* SEÇÃO 7 — FILTROS: CHIPS: criar, marcar e pintar os botões de filtro */
function criarChip(grupo, valor, rotulo) {
  const chip = elemento('button', rotulo);
  chip.type = 'button';
  chip.className = 'chip';
  chip.dataset.grupo = grupo;
  chip.dataset.valor = String(valor);

  if (grupo === 'tipo') chip.dataset.tipo = rotulo;
  chip.setAttribute('aria-pressed', 'false');
  chip.addEventListener('click', () => alternarChip(grupo, valor));
  return chip;
}

function montarChips() {
  Object.keys(TIPOS_PT)
    .filter(chave => chave !== 'unknown' && chave !== 'stellar')
    .forEach(chave => caixaTipos.appendChild(criarChip('tipo', chave, TIPOS_PT[chave])));

  REGIOES.forEach(r => caixaRegioes.appendChild(criarChip('regiao', r.geracao, r.nome)));

  CATEGORIAS.forEach(c => caixaCategorias.appendChild(criarChip('categoria', c.chave, c.nome)));
}

function ehFormaAlternativa(categoria) {
  return categoria === 'mega' || categoria === 'gmax';
}

function alternarChip(grupo, valor) {
  if (grupo === 'tipo') {
    const i = filtros.tipos.indexOf(valor);
    if (i >= 0) filtros.tipos.splice(i, 1);
    else filtros.tipos.push(valor);
  }

  if (grupo === 'regiao') {
    filtros.regiao = (filtros.regiao === valor) ? null : valor;
    if (filtros.regiao !== null && ehFormaAlternativa(filtros.categoria)) {
      filtros.categoria = null;
    }
  }

  if (grupo === 'categoria') {
    filtros.categoria = (filtros.categoria === valor) ? null : valor;
    if (ehFormaAlternativa(filtros.categoria)) {
      filtros.regiao = null;
    }
  }

  pintarChips();
}

function pintarChips() {
  painelFiltros.querySelectorAll('.chip').forEach(function (chip) {
    const valor = chip.dataset.valor;
    let ativo = false;

    if (chip.dataset.grupo === 'tipo')      ativo = filtros.tipos.indexOf(valor) >= 0;
    if (chip.dataset.grupo === 'regiao')    ativo = String(filtros.regiao) === valor;
    if (chip.dataset.grupo === 'categoria') ativo = filtros.categoria === valor;

    chip.setAttribute('aria-pressed', String(ativo));
  });

  mostrar(avisoFiltroEl, ehFormaAlternativa(filtros.categoria));
}

/* SEÇÃO 8 — FILTROS: APLICAR E LIMPAR: aplicarFiltros e limparFiltros */
async function aplicarFiltros(pagina) {
  ultimaAcao = () => aplicarFiltros(pagina);

  termoAtual = '';
  campoBusca.value = '';
  definirEstado('carregando');

  try {
    idsFiltrados = await filtrarPokemons(filtros);

    if (idsFiltrados && idsFiltrados.length === 0) {
      paginaAtual = 1;
      sincronizarURL();
      definirEstado('vazio');
      return;
    }

    await carregarPagina(pagina || 1);
  } catch (erro) {
    definirEstado('erro', erro.message);
  }
}

function limparFiltros() {
  filtros = { tipos: [], regiao: null, categoria: null };
  idsFiltrados = null;
  pintarChips();
  carregarPagina(1);
}

/* SEÇÃO 9 — EVENTOS: cliques e envio do formulário */
formBusca.addEventListener('submit', function (evento) {
  evento.preventDefault();
  const termo = campoBusca.value.trim();

  if (termo !== '') {
    fazerBusca(termo);
    return;
  }

  termoAtual = '';
  if (temFiltro()) aplicarFiltros(1);
  else { idsFiltrados = null; carregarPagina(1); }
});

botaoFiltros.addEventListener('click', function () {
  const vaiAbrir = painelFiltros.hidden;
  painelFiltros.hidden = !vaiAbrir;
  botaoFiltros.setAttribute('aria-expanded', String(vaiAbrir));
});

botaoAplicar.addEventListener('click', () => aplicarFiltros(1));
botaoLimpar.addEventListener('click', limparFiltros);

botaoAnterior.addEventListener('click', () => carregarPagina(paginaAtual - 1));
botaoProxima.addEventListener('click', () => carregarPagina(paginaAtual + 1));
botaoTentar.addEventListener('click', () => { if (ultimaAcao) ultimaAcao(); });

/* SEÇÃO 10 — INICIALIZAÇÃO: restaura o estado da URL ao abrir a tela */
lerURL();
montarChips();
pintarChips();
campoBusca.value = termoAtual;

if (termoAtual) {
  fazerBusca(termoAtual);
} else if (temFiltro()) {
  painelFiltros.hidden = false;
  botaoFiltros.setAttribute('aria-expanded', 'true');
  aplicarFiltros(paginaAtual);
} else {
  carregarPagina(paginaAtual);
}
