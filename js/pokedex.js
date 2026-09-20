/* ==========================================================================
   ARQUIVO: js/pokedex.js
   OBJETIVO: é a "camada de dados" do sistema. As telas pedem Pokémon para
             este arquivo e recebem o resultado pronto para exibir.
             Aqui ficam a busca, a paginação, os filtros, a efetividade de
             tipos e a linha evolutiva.
   DADOS: vêm de dados-pokemon.js (nada sai do navegador).

   Por que as funções são "async"? Para as telas não precisarem saber de onde
   vem o dado. Se um dia a fonte trocar (ex.: uma API), só este arquivo muda.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — CONSTANTES
   ========================================================================== */

/* Quantidade de Pokémon por página na lista (RF001). */
const TAMANHO_PAGINA = 20;

/* Lista dos seis atributos-base, na ordem em que aparecem na tela (RF003).
   Cada par é [nome do campo nos dados, texto mostrado na tela]. */
const NOMES_ATRIBUTOS = [
  ['hp', 'HP'],
  ['ataque', 'Ataque'],
  ['defesa', 'Defesa'],
  ['ataqueEspecial', 'Ataque Especial'],
  ['defesaEspecial', 'Defesa Especial'],
  ['velocidade', 'Velocidade']
];


/* ==========================================================================
   SEÇÃO 2 — MODELO DE POKÉMON
   Objetivo: converter o registro cru de dados-pokemon.js em um objeto
   "modelo", que é o formato usado por todas as telas.
   ========================================================================== */

/* Recebe um registro de POKEMONS e devolve o Pokémon pronto para as telas.
   - imagem / imagemShiny: o sprite é sempre img/pokemon/<id>.png.
   - tiposIngles: guardado para as contas de efetividade e para o filtro.
   - tipos: os mesmos tipos já traduzidos para português (o que a tela mostra).
   - atributos: vira uma lista de { nome, valor } na ordem de NOMES_ATRIBUTOS.
   - vantagens, fraquezas, imunidades, superEficazContra: começam vazios e só são
     preenchidos na tela de detalhes. */
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

/* Lista completa de Pokémon já convertida em modelo e ordenada pelo número.
   É montada uma única vez, quando o arquivo carrega. */
const TODOS_OS_POKEMONS = POKEMONS
  .slice()
  .sort((a, b) => a.id - b.id)
  .map(paraModelo);

/* Faz o caminho inverso: dado um modelo, devolve o registro original de
   POKEMONS (que tem campos como "historia", "familia" e "estagio"). */
function registroDe(pokemon) {
  return POKEMONS.find(registro => registro.id === pokemon.id);
}


/* ==========================================================================
   SEÇÃO 3 — CONSULTAS: BUSCAR UM POKÉMON, LISTAR, PESQUISAR
   ========================================================================== */

/* Devolve UM Pokémon a partir do número ou do nome.
   "004" e "4" resultam no mesmo Pokémon; o nome ignora maiúscula e acento.
   Se não encontrar, lança um erro com a mensagem 'Pokémon não encontrado.'
   (as telas capturam esse erro para mostrar a mensagem). */
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

/* Devolve uma PÁGINA da Pokédex (RF001): os itens daquela página, o total de
   Pokémon e o total de páginas. Ex.: página 2 = itens de 20 a 39. */
async function listarPagina(pagina) {
  const inicio = (pagina - 1) * TAMANHO_PAGINA;
  const total = TODOS_OS_POKEMONS.length;

  return {
    itens: TODOS_OS_POKEMONS.slice(inicio, inicio + TAMANHO_PAGINA),
    total: total,
    totalPaginas: Math.max(1, Math.ceil(total / TAMANHO_PAGINA))
  };
}

/* Busca da tela inicial (RF002). Aceita número ou pedaço do nome
   ("char" acha Charmander), ignorando maiúscula e acento.
   - Termo vazio: devolve lista vazia.
   - Só dígitos: busca pelo número da Pokédex e devolve um único resultado.
   - Caso contrário: devolve os Pokémon cujo nome contém o termo. */
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

/* Recebe uma lista de números e devolve os Pokémon correspondentes.
   Promise.all espera todas as buscas terminarem juntas. */
async function obterVariosPokemons(numeros) {
  return Promise.all(numeros.map(id => obterPokemon(id)));
}

/* Devolve o texto de "História" do Pokémon (já escrito em português).
   Se o Pokémon não tiver história, devolve texto vazio. */
async function obterHistoriaPokemon(idOuNome) {
  const pokemon = await obterPokemon(idOuNome);
  return registroDe(pokemon).historia || '';
}


/* ==========================================================================
   SEÇÃO 4 — EFETIVIDADE DE TIPOS (vantagens, fraquezas e imunidades)
   Objetivo: descobrir, para o Pokémon aberto na tela de detalhes, quais tipos
   de golpe são super efetivos contra ele, fracos ou não fazem efeito.
   ========================================================================== */

/* Quanto dano um golpe do tipo "tipoAtacante" causa em um "tipoDefensor".
   Consulta a tabela EFETIVIDADE; se o par não estiver na tabela, é 1 (normal). */
function efetividadeContra(tipoAtacante, tipoDefensor) {
  const linha = EFETIVIDADE[tipoAtacante] || {};
  return tipoDefensor in linha ? linha[tipoDefensor] : 1;
}

/* Calcula as quatro listas exibidas na tela de detalhes:
   - fraquezas: tipos que causam MAIS dano (multiplicador maior que 1);
   - vantagens (resistências): tipos que causam MENOS dano (entre 0 e 1);
   - imunidades: tipos que não causam dano (multiplicador 0);
   - superEficazContra: tipos que os ataques deste Pokémon acertam em dobro.
   Para cada tipo atacante, multiplica a efetividade contra TODOS os tipos do
   Pokémon. Ex.: Grama/Venenoso leva 2x de Fogo, porque Fogo é 2x contra Grama
   e 1x contra Venenoso (2 x 1 = 2). */
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


/* ==========================================================================
   SEÇÃO 5 — LINHA EVOLUTIVA
   ========================================================================== */

/* Monta a linha evolutiva de um Pokémon. Devolve um objeto com:
     estagios    Pokémon da mesma família, agrupados por estágio
                 (ex.: [[Pichu], [Pikachu], [Raichu]]);
     variacoes   Mega, Gigantamax, regionais etc. (nenhuma cadastrada por enquanto);
     requisitos  o que fazer para chegar em cada Pokémon, indexado pela "chave".
   Só entram Pokémon que estão cadastrados em dados-pokemon.js. */
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


/* ==========================================================================
   SEÇÃO 6 — FILTROS
   Ideia central: cada filtro devolve um CONJUNTO DE NÚMEROS (Set de ids).
   O número é a "moeda comum": para combinar dois filtros, basta ver quais
   números estão nos dois conjuntos.
   ========================================================================== */

/* Devolve o conjunto de ids dos Pokémon que passam na "condicao" recebida. */
function idsOnde(condicao) {
  return new Set(TODOS_OS_POKEMONS.filter(condicao).map(p => p.id));
}

/* Conjunto de ids de uma região: todos os Pokémon cujo número está na faixa
   da geração (definida em REGIOES, dados-filtro.js). */
function idsPorRegiao(geracao) {
  const regiao = REGIOES.find(r => r.geracao === geracao);
  if (!regiao) return new Set();
  return idsOnde(p => p.id >= regiao.primeiro && p.id <= regiao.ultimo);
}

/* Aplica todos os filtros escolhidos e devolve a lista de ids que passam em
   TODOS eles, já ordenada. A tela pagina em cima dessa lista.
   O parâmetro "filtros" tem o formato { tipos: [], regiao: numero, categoria: texto }.
   Passos:
     1. cada filtro marcado gera um conjunto de ids;
     2. os conjuntos são cruzados (Fogo + Voador = só quem é as duas coisas);
     3. só ficam ids que existem em dados-pokemon.js (as listas de lendários e
        míticos têm ids que podem não estar cadastrados).
   Se nenhum filtro estiver marcado, devolve null (= mostrar a Pokédex normal). */
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
