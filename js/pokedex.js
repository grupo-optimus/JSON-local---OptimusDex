/* SEÇÃO 1 — CONSTANTES: tamanho da página e ordem dos atributos */
const TAMANHO_PAGINA = 20;

const NOMES_ATRIBUTOS = [
  ['hp', 'HP'],
  ['ataque', 'Ataque'],
  ['defesa', 'Defesa'],
  ['ataqueEspecial', 'Ataque Especial'],
  ['defesaEspecial', 'Defesa Especial'],
  ['velocidade', 'Velocidade']
];

/* SEÇÃO 2 — MODELO DE POKÉMON: converte o registro de dados-pokemon.js no objeto usado pelas telas */
function paraModelo(registro) {
  return {
    id: registro.id,
    chave: registro.chave,
    nome: registro.nome,

    imagem: 'img/pokemon/' + registro.id + '.png',
    imagemShiny: 'img/pokemon/shiny/' + registro.id + '.png',

    tiposIngles: registro.tipos.slice(),
    tipos: registro.tipos.map(traduzirTipo),

    habilidades: registro.habilidades.slice(),

    atributos: NOMES_ATRIBUTOS.map(([campo, nome]) => ({
      nome: nome,
      valor: registro.atributos[campo]
    })),

    vantagens: [],
    fraquezas: [],
    imunidades: [],
    superEficazContra: []
  };
}

const TODOS_OS_POKEMONS = POKEMONS
  .slice()
  .sort((a, b) => a.id - b.id)
  .map(paraModelo);

function registroDe(pokemon) {
  return POKEMONS.find(registro => registro.id === pokemon.id);
}

/* SEÇÃO 3 — CONSULTAS: obterPokemon, listarPagina, buscarPokemons e história */
async function obterPokemon(idOuNome) {
  const chave = normalizarTexto(idOuNome);

  const pokemon = /^\d+$/.test(chave)
    ? TODOS_OS_POKEMONS.find(p => p.id === Number(chave))
    : TODOS_OS_POKEMONS.find(p => p.chave === chave || normalizarTexto(p.nome) === chave);

  if (!pokemon) {
    throw new Error('Pokémon não encontrado.');
  }

  return pokemon;
}

async function listarPagina(pagina) {
  const inicio = (pagina - 1) * TAMANHO_PAGINA;
  const total = TODOS_OS_POKEMONS.length;

  return {
    itens: TODOS_OS_POKEMONS.slice(inicio, inicio + TAMANHO_PAGINA),
    total: total,
    totalPaginas: Math.max(1, Math.ceil(total / TAMANHO_PAGINA))
  };
}

async function buscarPokemons(termo) {
  const alvo = normalizarTexto(termo);

  if (alvo === '') {
    return [];
  }

  if (/^\d+$/.test(alvo)) {
    return [await obterPokemon(alvo)];
  }

  return TODOS_OS_POKEMONS
    .filter(p => normalizarTexto(p.nome).includes(alvo))
    .slice(0, TAMANHO_PAGINA);
}

async function obterVariosPokemons(numeros) {
  return Promise.all(numeros.map(id => obterPokemon(id)));
}

async function obterHistoriaPokemon(idOuNome) {
  const pokemon = await obterPokemon(idOuNome);
  return registroDe(pokemon).historia || '';
}

/* SEÇÃO 4 — EFETIVIDADE DE TIPOS: cálculo de vantagens, fraquezas e imunidades */
function efetividadeContra(tipoAtacante, tipoDefensor) {
  const linha = EFETIVIDADE[tipoAtacante] || {};
  return tipoDefensor in linha ? linha[tipoDefensor] : 1;
}

async function obterVantagensEFraquezas(pokemon) {
  const todosOsTipos = Object.keys(TIPOS_PT).filter(tipo => tipo in EFETIVIDADE);
  const tiposDoPokemon = pokemon.tiposIngles;

  const multiplicadores = todosOsTipos.map(tipoAtacante => ({
    tipo: tipoAtacante,
    multiplicador: tiposDoPokemon.reduce(
      (total, tipoDefensor) => total * efetividadeContra(tipoAtacante, tipoDefensor), 1
    )
  }));

  const nomesDosTipos = lista => lista.map(item => traduzirTipo(item.tipo));

  return {
    vantagens: nomesDosTipos(multiplicadores.filter(m => m.multiplicador > 0 && m.multiplicador < 1)),
    fraquezas: nomesDosTipos(multiplicadores.filter(m => m.multiplicador > 1)),
    imunidades: nomesDosTipos(multiplicadores.filter(m => m.multiplicador === 0)),
    superEficazContra: todosOsTipos
      .filter(alvo => tiposDoPokemon.some(tipo => efetividadeContra(tipo, alvo) === 2))
      .map(traduzirTipo)
  };
}

/* SEÇÃO 5 — LINHA EVOLUTIVA: monta os estágios da evolução */
async function obterLinhaEvolutiva(idOuNome) {
  const pokemon = await obterPokemon(idOuNome);
  const familia = registroDe(pokemon).familia;

  const membros = POKEMONS
    .filter(registro => registro.familia === familia)
    .sort((a, b) => a.estagio - b.estagio || a.id - b.id);

  const estagios = [];
  const requisitos = {};
  let estagioAnterior = null;

  membros.forEach(function (registro) {
    const modelo = TODOS_OS_POKEMONS.find(p => p.id === registro.id);

    if (registro.estagio === estagioAnterior) {
      estagios[estagios.length - 1].push(modelo);
    } else {
      estagios.push([modelo]);
      estagioAnterior = registro.estagio;
    }

    if (registro.requisito) requisitos[registro.chave] = registro.requisito;
  });

  return { estagios, variacoes: [], requisitos };
}

/* SEÇÃO 6 — FILTROS: conjuntos de ids por tipo, região e categoria e cruzamento entre eles */
function idsOnde(condicao) {
  return new Set(TODOS_OS_POKEMONS.filter(condicao).map(p => p.id));
}

function idsPorRegiao(geracao) {
  const regiao = REGIOES.find(r => r.geracao === geracao);
  if (!regiao) return new Set();
  return idsOnde(p => p.id >= regiao.primeiro && p.id <= regiao.ultimo);
}

async function filtrarPokemons(filtros) {
  const conjuntos = [];

  (filtros.tipos || []).forEach(tipo => conjuntos.push(idsOnde(p => p.tiposIngles.includes(tipo))));

  if (filtros.regiao) conjuntos.push(idsPorRegiao(filtros.regiao));

  if (filtros.categoria === 'lendario') conjuntos.push(new Set(IDS_LENDARIOS));
  if (filtros.categoria === 'mitico')   conjuntos.push(new Set(IDS_MITICOS));
  if (filtros.categoria === 'mega')     conjuntos.push(idsOnde(p => p.chave.includes('-mega')));
  if (filtros.categoria === 'gmax')     conjuntos.push(idsOnde(p => p.chave.includes('-gmax')));

  if (conjuntos.length === 0) {
    return null;
  }

  let numeros = Array.from(conjuntos[0]);
  for (let i = 1; i < conjuntos.length; i++) {
    numeros = numeros.filter(id => conjuntos[i].has(id));
  }

  return numeros
    .filter(id => TODOS_OS_POKEMONS.some(p => p.id === id))
    .sort((a, b) => a - b);
}
