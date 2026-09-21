/* SEÇÃO 1 — ELEMENTOS DO HTML: referências aos elementos da tela por id */
const carregandoEl   = document.getElementById('estado-carregando');
const erroEl         = document.getElementById('estado-erro');
const mensagemErroEl = document.getElementById('mensagem-erro');
const conteudoEl     = document.getElementById('conteudo');
const botaoTentar    = document.getElementById('btn-tentar');

const imagemEl       = document.getElementById('poke-imagem');
const nomeEl         = document.getElementById('poke-nome');
const numeroEl       = document.getElementById('poke-numero');
const tiposEl        = document.getElementById('poke-tipos');
const habilidadesEl  = document.getElementById('poke-habilidades');
const atributosEl    = document.getElementById('poke-atributos');

const botaoFavorito  = document.getElementById('btn-favorito');
const botaoShiny     = document.getElementById('btn-shiny');
const botaoComparar  = document.getElementById('btn-comparar');

const historiaEl     = document.getElementById('poke-historia');
const historiaCarregandoEl = document.getElementById('historia-carregando');
const historiaErroEl  = document.getElementById('historia-erro');

const superEficazEl  = document.getElementById('poke-super-eficaz');
const vantagensEl    = document.getElementById('poke-vantagens');
const fraquezasEl    = document.getElementById('poke-fraquezas');
const imunidadesEl   = document.getElementById('poke-imunidades');

const secaoEvolucaoEl= document.getElementById('secao-evolucao');
const evolucaoEl     = document.getElementById('linha-evolucao');
const evoCarregandoEl= document.getElementById('evolucao-carregando');
const evoVaziaEl     = document.getElementById('evolucao-vazia');
const evoErroEl      = document.getElementById('evolucao-erro');
const blocoVariacoesEl = document.getElementById('bloco-variacoes');
const listaVariacoesEl = document.getElementById('lista-variacoes');

/* SEÇÃO 2 — ESTADO E CONSTANTES: Pokémon atual, modo shiny e valor máximo da barra */
let pokemonAtual = null;

let modoShiny = false;

const ATRIBUTO_MAXIMO = 255;

/* SEÇÃO 3 — ESTADO DA TELA: carregando, erro e pronto */
function definirEstado(estado, mensagem) {
  mostrar(carregandoEl, estado === 'carregando');
  mostrar(erroEl,       estado === 'erro');
  mostrar(conteudoEl,   estado === 'pronto');
  if (mensagem) mensagemErroEl.textContent = mensagem;
}

/* SEÇÃO 4 — SPRITES: troca entre imagem normal e shiny */
function desenhoAtual(pokemon) {
  return (modoShiny && pokemon.imagemShiny) ? pokemon.imagemShiny : pokemon.imagem;
}

function spritesDaEvolucao() {
  return Array.from(secaoEvolucaoEl.querySelectorAll('img'));
}

function trocarSprites() {
  if (pokemonAtual) imagemEl.src = desenhoAtual(pokemonAtual);

  spritesDaEvolucao().forEach(function (img) {
    const alvo = modoShiny ? img.dataset.shiny : img.dataset.normal;
    if (alvo) img.src = alvo;
  });
}

/* SEÇÃO 5 — APOIO DA FICHA: nível da barra e texto dos botões favoritar e comparar */
function nivelDoAtributo(valor) {
  if (valor >= 90) return 'alto';
  if (valor >= 55) return 'medio';
  return 'baixo';
}

function atualizarBotaoFavorito() {
  const favorito = estaFavoritado(pokemonAtual.id);
  botaoFavorito.textContent = favorito
    ? '★ Remover dos favoritos'
    : '☆ Adicionar aos favoritos';
  botaoFavorito.setAttribute('aria-pressed', String(favorito));
}

function atualizarBotaoComparar() {
  const selecionado = estaNaComparacao(pokemonAtual.id);
  botaoComparar.textContent = selecionado ? '✓ Remover da comparação' : '+ Comparar Pokémon';
  botaoComparar.setAttribute('aria-pressed', String(selecionado));
}

/* SEÇÃO 6 — VANTAGENS E FRAQUEZAS: desenho das listas de efetividade de tipos */
function desenharTiposEficacia(caixa, tipos) {
  caixa.replaceChildren();
  tipos.forEach(function (tipo) {
    const item = elemento('li', tipo);
    item.className = 'tipo';
    item.dataset.tipo = tipo;
    caixa.appendChild(item);
  });
}

function desenharVantagensEFraquezas(efetividade) {
  pokemonAtual.superEficazContra = efetividade.superEficazContra;
  pokemonAtual.vantagens = efetividade.vantagens;
  pokemonAtual.fraquezas = efetividade.fraquezas;
  pokemonAtual.imunidades = efetividade.imunidades;

  desenharTiposEficacia(superEficazEl, pokemonAtual.superEficazContra);
  desenharTiposEficacia(vantagensEl, pokemonAtual.vantagens);
  desenharTiposEficacia(fraquezasEl, pokemonAtual.fraquezas);
  desenharTiposEficacia(imunidadesEl, pokemonAtual.imunidades);

  mostrar(superEficazEl.parentElement, pokemonAtual.superEficazContra.length > 0);
  mostrar(vantagensEl.parentElement, pokemonAtual.vantagens.length > 0);
  mostrar(fraquezasEl.parentElement, pokemonAtual.fraquezas.length > 0);
  mostrar(imunidadesEl.parentElement, pokemonAtual.imunidades.length > 0);
}

/* SEÇÃO 7 — HISTÓRIA: carregamento e exibição do texto da história */
function estadoHistoria(estado) {
  mostrar(historiaCarregandoEl, estado === 'carregando');
  mostrar(historiaErroEl, estado === 'erro');
  mostrar(historiaEl, estado === 'pronto');
}

async function carregarHistoria(id) {
  estadoHistoria('carregando');
  historiaEl.textContent = '';

  try {
    const historia = await obterHistoriaPokemon(id);

    if (!historia) {
      throw new Error('História vazia.');
    }

    historiaEl.textContent = historia;
    estadoHistoria('pronto');
  } catch (erro) {
    estadoHistoria('erro');
  }
}

/* SEÇÃO 8 — FICHA PRINCIPAL: imagem, nome, tipos, habilidades, atributos e total */
function desenharPokemon(pokemon) {
  document.title = pokemon.nome + ' — Detalhes';

  imagemEl.src = desenhoAtual(pokemon);
  imagemEl.alt = pokemon.nome;
  nomeEl.textContent = pokemon.nome;
  numeroEl.textContent = numeroFormatado(pokemon.id);

  tiposEl.replaceChildren();
  pokemon.tipos.forEach(function (tipo) {
    const item = elemento('li', tipo);
    item.className = 'tipo';
    item.dataset.tipo = tipo;
    tiposEl.appendChild(item);
  });

  habilidadesEl.replaceChildren();
  pokemon.habilidades.forEach(h => habilidadesEl.appendChild(elemento('li', h)));

  atributosEl.replaceChildren();
  pokemon.atributos.forEach(function (atributo) {
    const linha = elemento('tr');
    linha.appendChild(elemento('th', atributo.nome));
    linha.appendChild(elemento('td', String(atributo.valor)));

    const celulaBarra = elemento('td');
    const barra = elemento('progress');
    barra.value = atributo.valor;
    barra.max = ATRIBUTO_MAXIMO;
    barra.dataset.nivel = nivelDoAtributo(atributo.valor);
    celulaBarra.appendChild(barra);
    linha.appendChild(celulaBarra);

    atributosEl.appendChild(linha);
  });

  const totalAtributos = pokemon.atributos.reduce(function (total, atributo) {
    return total + Number(atributo.valor);
  }, 0);

  const totalAtributosEl = document.getElementById('poke-total-atributos');
  if (totalAtributosEl) {
    totalAtributosEl.textContent = String(totalAtributos);
  }

  atualizarBotaoFavorito();
  atualizarBotaoComparar();
  atualizarLinksComparacao();
}

/* SEÇÃO 9 — LINHA EVOLUTIVA: cards da cadeia evolutiva e das formas especiais */
function identificarFormaEspecial(pokemon) {
  const chave = String(pokemon.chave || '').toLowerCase();

  const regras = [
    { padrao: /-mega-x$/, rotulo: 'MEGA X' },
    { padrao: /-mega-y$/, rotulo: 'MEGA Y' },
    { padrao: /-mega$/, rotulo: 'MEGA' },
    { padrao: /-gmax$/, rotulo: 'GIGANTAMAX' },
    { padrao: /-primal$/, rotulo: 'PRIMAL' },
    { padrao: /-ash$/, rotulo: 'ASH' },
    { padrao: /-(alola|galar|hisui|paldea)$/, rotulo: 'REGIONAL' },
    { padrao: /-origin$/, rotulo: 'ORIGIN' },
    { padrao: /-(attack|defense|speed)$/, rotulo: 'FORMA' },
    { padrao: /-(altered|sky|school|solo|complete|zen|crowned|eternamax|hero|resolute|ordinary|therian|incarnate)$/, rotulo: 'FORMA' },
    { padrao: /-(white|black|sunny|rainy|snowy|dusk|dawn|midnight|midday|low-key|amped|full-belly|hangry)$/, rotulo: 'FORMA' },
    { padrao: /-(10|50|100)-percent$/, rotulo: 'FORMA' },
    { padrao: /-(rock-star|belle|pop-star|phd|libre|cosplay|original-cap|hoenn-cap|sinnoh-cap|unova-cap|kalos-cap|alola-cap|partner-cap|world-cap)$/, rotulo: 'FORMA' }
  ];

  const encontrada = regras.find(regra => regra.padrao.test(chave));
  return encontrada ? encontrada.rotulo : null;
}

function criarElo(pokemon, opcoes) {
  const config = opcoes || {};

  const elo = elemento('a');
  elo.className = 'evo';
  elo.href = 'detalhes.html?id=' + pokemon.id;

  if (pokemon.id === pokemonAtual.id) {
    elo.classList.add('evo-atual');
  }

  if (config.variacao) {
    elo.classList.add('evo-forma-especial');
  }

  const img = elemento('img');
  img.src = desenhoAtual(pokemon);
  img.alt = pokemon.nome;
  img.width = 128;
  img.height = 128;
  img.loading = 'lazy';
  img.dataset.normal = pokemon.imagem;
  if (pokemon.imagemShiny) img.dataset.shiny = pokemon.imagemShiny;

  const numero = elemento('span', numeroFormatado(pokemon.id));
  numero.className = 'dex-numero';

  const nome = elemento('span', pokemon.nome);
  nome.className = 'dex-nome';

  elo.appendChild(img);
  elo.appendChild(numero);
  elo.appendChild(nome);

  if (config.variacao) {
    const rotulo = identificarFormaEspecial(pokemon) || 'FORMA';
    const badge = elemento('span', rotulo);
    badge.className = 'forma-especial-badge';
    badge.setAttribute('aria-label', 'Forma especial: ' + rotulo);
    elo.appendChild(badge);
  }

  if (config.requisito) {
    const comoEvoluir = elemento('span', config.requisito);
    comoEvoluir.className = 'evo-requisito';
    elo.appendChild(comoEvoluir);
  }

  return elo;
}

function estadoEvolucao(estado) {
  mostrar(evoCarregandoEl, estado === 'carregando');
  mostrar(evoVaziaEl,      estado === 'vazia');
  mostrar(evoErroEl,       estado === 'erro');
  mostrar(evolucaoEl,      estado === 'pronto');
  if (estado !== 'pronto') mostrar(blocoVariacoesEl, false);
}

function desenharEvolucao(linha) {
  evolucaoEl.replaceChildren();

  linha.estagios.forEach(function (pokemons, indice) {
    const estagio = elemento('li');
    estagio.className = 'estagio';

    const formas = elemento('div');
    formas.className = 'formas';

    pokemons.forEach(function (pokemon) {

      const requisito = indice === 0 ? '' : (linha.requisitos[pokemon.chave] || '');
      formas.appendChild(criarElo(pokemon, { requisito: requisito }));
    });

    estagio.appendChild(formas);
    evolucaoEl.appendChild(estagio);
  });

  listaVariacoesEl.replaceChildren();

  linha.variacoes.forEach(function (pokemon) {
    const item = elemento('li');
    item.appendChild(criarElo(pokemon, { variacao: true }));
    listaVariacoesEl.appendChild(item);
  });

  mostrar(blocoVariacoesEl, linha.variacoes.length > 0);
}

async function carregarEvolucao(id) {
  estadoEvolucao('carregando');

  try {
    const linha = await obterLinhaEvolutiva(id);

    if (linha.estagios.length <= 1 && linha.variacoes.length === 0) {
      estadoEvolucao('vazia');
      return;
    }

    desenharEvolucao(linha);
    estadoEvolucao('pronto');
  } catch (erro) {
    estadoEvolucao('erro');
  }
}

/* SEÇÃO 10 — CARREGAR TUDO: carregarDetalhes, função principal da tela */
async function carregarDetalhes() {
  const id = parametroDaURL('id') || '1';
  definirEstado('carregando');

  try {
    pokemonAtual = await obterPokemon(id);
    desenharPokemon(pokemonAtual);
    definirEstado('pronto');

    carregarHistoria(pokemonAtual.id);

    try {
      const efetividade = await obterVantagensEFraquezas(pokemonAtual);
      desenharVantagensEFraquezas(efetividade);
    } catch (erro) {
      mostrar(superEficazEl.parentElement, false);
      mostrar(vantagensEl.parentElement, false);
      mostrar(fraquezasEl.parentElement, false);
      mostrar(imunidadesEl.parentElement, false);
    }

    carregarEvolucao(pokemonAtual.id);
  } catch (erro) {
    definirEstado('erro', erro.message);
  }
}

/* SEÇÃO 11 — BOTÕES FAVORITAR E COMPARAR: eventos de clique dos dois botões */
botaoFavorito.addEventListener('click', function () {
  if (!pokemonAtual) return;
  alternarFavorito(pokemonAtual);
  atualizarBotaoFavorito();
});

botaoComparar.addEventListener('click', function () {
  if (!pokemonAtual) return;
  const resultado = alternarComparacao(pokemonAtual);
  if (resultado.cheia) {
    window.alert('A comparação já possui 6 Pokémon. Remova um para adicionar outro.');
    return;
  }
  atualizarBotaoComparar();
  atualizarLinksComparacao();
});

/* SEÇÃO 12 — BRILHO SHINY: clarão e faíscas ao trocar normal/shiny */
const QUANTAS_FAISCAS = 7;

function darClarao(sprite, atraso) {
  sprite.classList.remove('cintilando');

  sprite.getAnimations().forEach(animacao => animacao.cancel());

  sprite.style.setProperty('--atraso-brilho', atraso + 'ms');
  void sprite.offsetWidth;
  sprite.classList.add('cintilando');
}

function brilharTudo() {
  const sprites = [imagemEl].concat(spritesDaEvolucao());
  sprites.forEach((sprite, i) => darClarao(sprite, i * 70));
}

function soltarFaiscas() {
  const visor = imagemEl.parentElement;
  limparBrilho(visor);

  for (let i = 0; i < QUANTAS_FAISCAS; i++) {
    const faisca = elemento('div');
    faisca.className = 'faisca';

    faisca.style.left = (10 + Math.random() * 72) + '%';
    faisca.style.top  = (6 + Math.random() * 58) + '%';
    faisca.style.setProperty('--atraso-faisca', (i * 55) + 'ms');

    visor.appendChild(faisca);
  }

  window.setTimeout(() => limparBrilho(visor), 1200);
}

function limparBrilho(visor) {
  visor.querySelectorAll('.faisca').forEach(el => el.remove());
}

botaoShiny.addEventListener('click', function () {
  modoShiny = !modoShiny;
  botaoShiny.textContent = modoShiny ? 'Ver normal' : 'Ver shiny';
  botaoShiny.setAttribute('aria-pressed', String(modoShiny));

  trocarSprites();
  brilharTudo();

  if (modoShiny) soltarFaiscas();
});

/* SEÇÃO 13 — INICIALIZAÇÃO: botão tentar novamente e primeira carga */
botaoTentar.addEventListener('click', carregarDetalhes);

carregarDetalhes();
