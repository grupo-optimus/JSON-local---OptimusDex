/* ==========================================================================
   ARQUIVO: js/pagina-lista.js
   OBJETIVO: controla a tela inicial (index.html): lista de Pokémon (RF001),
             busca (RF002) e filtros.
   TRÊS MODOS DE EXIBIÇÃO (um de cada vez):
     1. Pokédex normal -> página por página, direto de dados-pokemon.js
     2. Busca por nome ou número -> RF002
     3. Filtro -> pokedex.js devolve os números que servem e a tela pagina em
                  cima dessa lista, 20 por vez
   ESTADO NA URL: a busca, os filtros e a página ficam no endereço
   (?q=, ?tipo=, ?regiao=, ?categoria=, ?pagina=). Por isso o botão Voltar da
   tela de detalhes consegue trazer a pessoa de volta para onde estava.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — REFERÊNCIAS AOS ELEMENTOS DO HTML
   Cada constante guarda um elemento de index.html, buscado pelo seu id.
   ========================================================================== */

/* Estados da lista e área de resultados */
const listaEl        = document.getElementById('lista-pokemons');
const carregandoEl   = document.getElementById('estado-carregando');
const erroEl         = document.getElementById('estado-erro');
const mensagemErroEl = document.getElementById('mensagem-erro');
const vazioEl        = document.getElementById('sem-resultado');

/* Paginação */
const paginacaoEl    = document.getElementById('paginacao');
const infoPaginaEl   = document.getElementById('info-pagina');
const botaoAnterior  = document.getElementById('btn-anterior');
const botaoProxima   = document.getElementById('btn-proxima');

/* Busca e botão "Tentar novamente" */
const formBusca      = document.getElementById('form-busca');
const campoBusca     = document.getElementById('busca');
const botaoTentar    = document.getElementById('btn-tentar');

/* Painel de filtros */
const botaoFiltros   = document.getElementById('btn-filtros');
const painelFiltros  = document.getElementById('painel-filtros');
const caixaTipos     = document.getElementById('filtro-tipos');
const caixaRegioes   = document.getElementById('filtro-regioes');
const caixaCategorias= document.getElementById('filtro-categorias');
const avisoFiltroEl  = document.getElementById('aviso-filtro');
const botaoAplicar   = document.getElementById('btn-aplicar-filtros');
const botaoLimpar    = document.getElementById('btn-limpar-filtros');


/* ==========================================================================
   SEÇÃO 2 — VARIÁVEIS DE ESTADO
   Guardam "como a tela está agora".
   ========================================================================== */
let paginaAtual = 1;                                       /* página em exibição */
let termoAtual = '';                                       /* texto da busca atual */
let filtros = { tipos: [], regiao: null, categoria: null };/* filtros marcados */
let idsFiltrados = null;  /* lista de números que passaram no filtro; null = sem filtro */
let ultimaAcao = null;    /* última ação feita; o botão "Tentar novamente" repete ela (RF007) */


/* ==========================================================================
   SEÇÃO 3 — ESTADOS DA TELA E DESENHO DA LISTA
   ========================================================================== */

/* Liga um estado da tela e desliga os outros: 'carregando', 'erro', 'vazio' ou
   'pronto'. A paginação só aparece quando está pronto e não há busca por texto.
   Se vier uma mensagem, ela é escrita na área de erro. */
function definirEstado(estado, mensagem) {
  mostrar(carregandoEl, estado === 'carregando');
  mostrar(erroEl,       estado === 'erro');
  mostrar(vazioEl,      estado === 'vazio');
  mostrar(listaEl,      estado === 'pronto');
  mostrar(paginacaoEl,  estado === 'pronto' && termoAtual === '');
  if (mensagem) mensagemErroEl.textContent = mensagem;
}

/* Apaga a lista atual e desenha um card para cada Pokémon recebido.
   Cada card já vem com a estrela de favoritar (RF004). */
function desenharLista(pokemons) {
  listaEl.replaceChildren();
  pokemons.forEach(p => listaEl.appendChild(criarCardPokemon(p, { comBotaoFavorito: true })));
  atualizarLinksComparacao();
}

/* Diz (true/false) se existe algum filtro marcado. */
function temFiltro() {
  return filtros.tipos.length > 0 || filtros.regiao !== null || filtros.categoria !== null;
}


/* ==========================================================================
   SEÇÃO 4 — ESTADO NA URL
   Objetivo: manter o endereço da página sempre igual ao estado da tela.
   ========================================================================== */

/* Escreve o estado atual (busca, filtros e página) no endereço.
   replaceState troca o endereço SEM recarregar a página e SEM criar uma nova
   entrada no histórico; assim, passar por 5 páginas não obriga a apertar
   "voltar" 5 vezes.
   No final, anota o endereço para o botão Voltar da tela de detalhes. */
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

/* Faz o caminho inverso: lê o endereço e preenche as variáveis de estado.
   Roda quando a página abre, para restaurar busca, filtros e página. */
function lerURL() {
  const partes = new URLSearchParams(window.location.search);

  termoAtual        = partes.get('q') || '';
  filtros.tipos     = (partes.get('tipo') || '').split(',').filter(Boolean);
  filtros.regiao    = partes.get('regiao') ? Number(partes.get('regiao')) : null;
  filtros.categoria = partes.get('categoria') || null;
  paginaAtual       = Math.max(1, Number(partes.get('pagina')) || 1);
}


/* ==========================================================================
   SEÇÃO 5 — CARREGAR UMA PÁGINA DA LISTA
   Serve para os dois modos com paginação: Pokédex inteira e resultado de filtro.
   ========================================================================== */

/* Carrega e desenha uma página.
   - Com filtro ativo: fatia 20 números da lista idsFiltrados e busca só esses.
   - Sem filtro: pede a página direto para listarPagina().
   Depois atualiza o texto "Página X de Y", habilita ou desabilita os botões
   Anterior/Próxima, atualiza a URL e mostra a lista. Se algo falhar, mostra o
   estado de erro (RF007). */
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


/* ==========================================================================
   SEÇÃO 6 — BUSCA (RF002)
   ========================================================================== */

/* Faz a busca por nome ou número.
   Buscar e filtrar são modos diferentes, então buscar LIMPA os filtros (senão a
   tela mostraria um resultado que não bate com os botões marcados).
   - Nenhum resultado: mostra "Nenhum Pokémon encontrado".
   - Número que não existe: também cai como "não encontrado", e não como erro.
   - Outro erro: mostra o estado de erro. */
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


/* ==========================================================================
   SEÇÃO 7 — FILTROS: BOTÕES (CHIPS)
   ========================================================================== */

/* Cria um botão de filtro ("chip").
     grupo   a que grupo pertence: 'tipo', 'regiao' ou 'categoria';
     valor   o valor guardado no botão (ex.: 'fire', 1, 'lendario');
     rotulo  o texto exibido (ex.: 'Fogo').
   Os chips de tipo recebem data-tipo, o mesmo atributo das plaquinhas dos
   cards, para o CSS pintar cada tipo com a sua cor. */
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

/* Cria todos os chips a partir dos dicionários (TIPOS_PT, REGIOES e CATEGORIAS).
   Assim, se alguém adicionar um tipo em traducoes.js, ele aparece aqui sozinho.
   'unknown' e 'stellar' ficam de fora porque não têm Pokémon útil. */
function montarChips() {
  Object.keys(TIPOS_PT)
    .filter(chave => chave !== 'unknown' && chave !== 'stellar')
    .forEach(chave => caixaTipos.appendChild(criarChip('tipo', chave, TIPOS_PT[chave])));

  REGIOES.forEach(r => caixaRegioes.appendChild(criarChip('regiao', r.geracao, r.nome)));

  CATEGORIAS.forEach(c => caixaCategorias.appendChild(criarChip('categoria', c.chave, c.nome)));
}

/* Diz se a categoria é uma forma alternativa (Mega ou Gigantamax). */
function ehFormaAlternativa(categoria) {
  return categoria === 'mega' || categoria === 'gmax';
}

/* Marca ou desmarca um chip, atualizando o objeto "filtros".
   - Tipo: aceita vários ao mesmo tempo (Fogo + Voador acha o Charizard).
   - Região e categoria: aceitam só um; clicar de novo no mesmo desmarca.
   - Mega/Gigantamax e região são exclusivos: formas Mega/Gmax têm número acima
     de 10000 e nunca estão na faixa de uma região. Marcar os dois daria sempre
     lista vazia, então marcar um desmarca o outro. */
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

/* Repinta os chips a partir do objeto "filtros" (o estado manda; o visual
   apenas obedece). O atributo aria-pressed é o que o CSS usa para destacar o
   chip marcado. Também mostra o aviso de Mega/Gigantamax quando necessário. */
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


/* ==========================================================================
   SEÇÃO 8 — FILTROS: APLICAR E LIMPAR
   ========================================================================== */

/* Aplica os filtros marcados e mostra o resultado a partir da página informada.
   Filtrar LIMPA a busca (mesmo motivo de buscar limpar o filtro).
   Se nenhum Pokémon passar no filtro, mostra o estado "vazio". */
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

/* Desmarca todos os filtros e volta para a Pokédex normal, na página 1. */
function limparFiltros() {
  filtros = { tipos: [], regiao: null, categoria: null };
  idsFiltrados = null;
  pintarChips();
  carregarPagina(1);
}


/* ==========================================================================
   SEÇÃO 9 — EVENTOS (o que acontece quando o usuário clica ou envia o formulário)
   ========================================================================== */

/* Envio do formulário de busca. preventDefault impede o recarregamento da
   página; quem busca é o JavaScript.
   - Com texto: faz a busca.
   - Campo vazio: volta ao que estiver valendo (o filtro, se houver; senão a
     Pokédex normal). */
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

/* Botão "Filtros": abre e fecha o painel de filtros. */
botaoFiltros.addEventListener('click', function () {
  const vaiAbrir = painelFiltros.hidden;
  painelFiltros.hidden = !vaiAbrir;
  botaoFiltros.setAttribute('aria-expanded', String(vaiAbrir));
});

/* Botões do painel de filtros. */
botaoAplicar.addEventListener('click', () => aplicarFiltros(1));
botaoLimpar.addEventListener('click', limparFiltros);

/* Botões de paginação e "Tentar novamente" (repete a última ação que falhou). */
botaoAnterior.addEventListener('click', () => carregarPagina(paginaAtual - 1));
botaoProxima.addEventListener('click', () => carregarPagina(paginaAtual + 1));
botaoTentar.addEventListener('click', () => { if (ultimaAcao) ultimaAcao(); });


/* ==========================================================================
   SEÇÃO 10 — INICIALIZAÇÃO (o que roda quando a tela abre)
   Lê a URL, cria os chips e obedece o que estiver no endereço:
   - com busca na URL: refaz a busca;
   - com filtro na URL: abre o painel de filtros e reaplica;
   - sem nada: mostra a Pokédex normal na página 1.
   ========================================================================== */
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
