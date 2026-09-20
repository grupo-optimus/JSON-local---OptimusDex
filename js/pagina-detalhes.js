/* ==========================================================================
   ARQUIVO: js/pagina-detalhes.js
   OBJETIVO: controla a tela de detalhes (detalhes.html): mostra a ficha
             completa de UM Pokémon (RF003) e permite favoritar (RF004),
             comparar e alternar para a versão shiny.
   QUAL POKÉMON? O que vier no endereço: detalhes.html?id=NUMERO.
   ORDEM DE CARREGAMENTO: primeiro a ficha principal; depois, separados, a
   história, as vantagens/fraquezas e a linha evolutiva. Se uma dessas partes
   falhar, só ela avisa e o resto da ficha continua na tela.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — REFERÊNCIAS AOS ELEMENTOS DO HTML
   ========================================================================== */

/* Estados da tela inteira */
const carregandoEl   = document.getElementById('estado-carregando');
const erroEl         = document.getElementById('estado-erro');
const mensagemErroEl = document.getElementById('mensagem-erro');
const conteudoEl     = document.getElementById('conteudo');
const botaoTentar    = document.getElementById('btn-tentar');

/* Ficha principal: imagem, nome, número, tipos, habilidades, atributos */
const imagemEl       = document.getElementById('poke-imagem');
const nomeEl         = document.getElementById('poke-nome');
const numeroEl       = document.getElementById('poke-numero');
const tiposEl        = document.getElementById('poke-tipos');
const habilidadesEl  = document.getElementById('poke-habilidades');
const atributosEl    = document.getElementById('poke-atributos');

/* Botões do visor */
const botaoFavorito  = document.getElementById('btn-favorito');
const botaoShiny     = document.getElementById('btn-shiny');
const botaoComparar  = document.getElementById('btn-comparar');

/* História */
const historiaEl     = document.getElementById('poke-historia');
const historiaCarregandoEl = document.getElementById('historia-carregando');
const historiaErroEl  = document.getElementById('historia-erro');

/* Efetividade de tipos */
const superEficazEl  = document.getElementById('poke-super-eficaz');
const vantagensEl    = document.getElementById('poke-vantagens');
const fraquezasEl    = document.getElementById('poke-fraquezas');
const imunidadesEl   = document.getElementById('poke-imunidades');

/* Linha evolutiva */
const secaoEvolucaoEl= document.getElementById('secao-evolucao');
const evolucaoEl     = document.getElementById('linha-evolucao');
const evoCarregandoEl= document.getElementById('evolucao-carregando');
const evoVaziaEl     = document.getElementById('evolucao-vazia');
const evoErroEl      = document.getElementById('evolucao-erro');
const blocoVariacoesEl = document.getElementById('bloco-variacoes');
const listaVariacoesEl = document.getElementById('lista-variacoes');


/* ==========================================================================
   SEÇÃO 2 — VARIÁVEIS DE ESTADO E CONSTANTES
   ========================================================================== */

/* O Pokémon que está aberto na tela. Começa vazio e é preenchido em carregarDetalhes(). */
let pokemonAtual = null;

/* Quando true, todos os sprites da tela aparecem na versão shiny (cor rara). */
let modoShiny = false;

/* Maior valor possível de um atributo-base (255). É o "teto" da barra. */
const ATRIBUTO_MAXIMO = 255;


/* ==========================================================================
   SEÇÃO 3 — ESTADO DA TELA (carregando / erro / pronto)
   ========================================================================== */

/* Liga um estado da tela e desliga os outros: 'carregando', 'erro' ou 'pronto'.
   Se vier uma mensagem, ela é escrita na área de erro (RF007). */
function definirEstado(estado, mensagem) {
  mostrar(carregandoEl, estado === 'carregando');
  mostrar(erroEl,       estado === 'erro');
  mostrar(conteudoEl,   estado === 'pronto');
  if (mensagem) mensagemErroEl.textContent = mensagem;
}


/* ==========================================================================
   SEÇÃO 4 — SPRITES: NORMAL x SHINY
   ========================================================================== */

/* Escolhe qual imagem usar agora: a shiny (se o modo estiver ligado e o Pokémon
   tiver uma) ou a normal. */
function desenhoAtual(pokemon) {
  return (modoShiny && pokemon.imagemShiny) ? pokemon.imagemShiny : pokemon.imagem;
}

/* Devolve todas as imagens da seção de linha evolutiva (cadeia + variações). */
function spritesDaEvolucao() {
  return Array.from(secaoEvolucaoEl.querySelectorAll('img'));
}

/* Troca as imagens conforme o modo (normal ou shiny): a imagem grande do visor
   e os sprites da linha evolutiva. Cada sprite da linha guarda os dois endereços
   em data-normal e data-shiny. */
function trocarSprites() {
  if (pokemonAtual) imagemEl.src = desenhoAtual(pokemonAtual);

  spritesDaEvolucao().forEach(function (img) {
    const alvo = modoShiny ? img.dataset.shiny : img.dataset.normal;
    if (alvo) img.src = alvo;
  });
}


/* ==========================================================================
   SEÇÃO 5 — FUNÇÕES DE APOIO DA FICHA
   ========================================================================== */

/* Classifica um atributo para pintar a barra, como a barra de HP dos jogos:
   90 ou mais = 'alto' (verde), de 55 a 89 = 'medio' (amarelo), abaixo = 'baixo'
   (vermelho). O CSS lê o valor pelo atributo data-nivel. */
function nivelDoAtributo(valor) {
  if (valor >= 90) return 'alto';
  if (valor >= 55) return 'medio';
  return 'baixo';
}

/* Atualiza o texto do botão de favoritar: estrela cheia se já é favorito,
   vazia se ainda não é. */
function atualizarBotaoFavorito() {
  const favorito = estaFavoritado(pokemonAtual.id);
  botaoFavorito.textContent = favorito
    ? '★ Remover dos favoritos'
    : '☆ Adicionar aos favoritos';
  botaoFavorito.setAttribute('aria-pressed', String(favorito));
}

/* Atualiza o texto do botão de comparar conforme o Pokémon esteja ou não na
   comparação. */
function atualizarBotaoComparar() {
  const selecionado = estaNaComparacao(pokemonAtual.id);
  botaoComparar.textContent = selecionado ? '✓ Remover da comparação' : '+ Comparar Pokémon';
  botaoComparar.setAttribute('aria-pressed', String(selecionado));
}


/* ==========================================================================
   SEÇÃO 6 — VANTAGENS, FRAQUEZAS E IMUNIDADES
   ========================================================================== */

/* Preenche uma lista (<ul>) com uma plaquinha colorida para cada tipo recebido.
   O data-tipo é o que o CSS usa para escolher a cor. */
function desenharTiposEficacia(caixa, tipos) {
  caixa.replaceChildren();
  tipos.forEach(function (tipo) {
    const item = elemento('li', tipo);
    item.className = 'tipo';
    item.dataset.tipo = tipo;
    caixa.appendChild(item);
  });
}

/* Recebe o resultado de obterVantagensEFraquezas() (pokedex.js), guarda no
   Pokémon atual e desenha as quatro listas. Uma seção que ficar sem nenhum tipo
   é escondida. */
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


/* ==========================================================================
   SEÇÃO 7 — HISTÓRIA
   A entrada da Pokédex já vem escrita em português, de dados-pokemon.js.
   ========================================================================== */

/* Liga um estado da área de história: 'carregando', 'erro' ou 'pronto'. */
function estadoHistoria(estado) {
  mostrar(historiaCarregandoEl, estado === 'carregando');
  mostrar(historiaErroEl, estado === 'erro');
  mostrar(historiaEl, estado === 'pronto');
}

/* Busca a história do Pokémon e a escreve na tela. Se vier vazia ou der erro,
   mostra a mensagem de erro só nessa área. */
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


/* ==========================================================================
   SEÇÃO 8 — DESENHAR A FICHA PRINCIPAL
   ========================================================================== */

/* Preenche a tela com os dados do Pokémon:
   - título da aba do navegador, imagem, nome e número;
   - tipos (plaquinhas coloridas) e habilidades;
   - os seis atributos, cada um com valor e barra colorida;
   - o total dos atributos;
   - o estado dos botões de favoritar e comparar e o contador do topo. */
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


/* ==========================================================================
   SEÇÃO 9 — LINHA EVOLUTIVA
   Cada "elo" é um Pokémon da cadeia e é clicável (leva para a tela dele).
   O elo do Pokémon que está aberto fica destacado.
   ========================================================================== */

/* Descobre o rótulo de uma forma especial (MEGA X, GIGANTAMAX, REGIONAL, ...)
   olhando o final da "chave" do Pokémon com expressões regulares.
   Se nenhuma regra bater, devolve null e quem chamou decide o que fazer. */
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

/* Cria o card (link) de UM Pokémon da linha evolutiva: imagem, número e nome.
   O segundo parâmetro (opcoes) pode trazer:
     variacao   true para o card da fileira de baixo (Mega, Gmax, regional...),
                que ganha uma etiqueta com o tipo de forma;
     requisito  texto de "como evoluir até este Pokémon". */
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

/* Liga um estado da seção de evolução: 'carregando', 'vazia', 'erro' ou 'pronto'.
   Fora do estado 'pronto', a fileira de variações também fica escondida. */
function estadoEvolucao(estado) {
  mostrar(evoCarregandoEl, estado === 'carregando');
  mostrar(evoVaziaEl,      estado === 'vazia');
  mostrar(evoErroEl,       estado === 'erro');
  mostrar(evolucaoEl,      estado === 'pronto');
  if (estado !== 'pronto') mostrar(blocoVariacoesEl, false);
}

/* Desenha a linha evolutiva em duas fileiras:
   - de cima: a cadeia em ordem, um estágio atrás do outro. Um estágio pode ter
     vários Pokémon (ex.: Eevee evolui para oito), que dividem o mesmo degrau;
   - de baixo: as formas alternativas (Mega, Gigantamax, regionais). Só aparece
     se a espécie tiver alguma. */
function desenharEvolucao(linha) {
  evolucaoEl.replaceChildren();

  linha.estagios.forEach(function (pokemons, indice) {
    const estagio = elemento('li');
    estagio.className = 'estagio';

    const formas = elemento('div');
    formas.className = 'formas';

    pokemons.forEach(function (pokemon) {
      /* O primeiro estágio é o ponto de partida: ninguém evolui para ele. */
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

/* Busca e desenha a linha evolutiva. É chamada DEPOIS do resto da ficha: se
   falhar, só essa seção avisa.
   Um único estágio significa que o Pokémon não evolui; nesse caso (e sem
   variações) mostra a mensagem "nenhuma evolução cadastrada". */
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


/* ==========================================================================
   SEÇÃO 10 — CARREGAR TUDO (função principal da tela)
   ========================================================================== */

/* Descobre qual Pokémon abrir (parâmetro "id" da URL; sem id, mostra o
   Bulbasaur) e carrega a tela por partes:
   1. ficha principal (essencial, aparece primeiro);
   2. história (independente, não bloqueia a ficha);
   3. vantagens e fraquezas (se falhar, as seções somem e o resto continua);
   4. linha evolutiva.
   Se o Pokémon não existir, mostra o estado de erro (RF007). */
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


/* ==========================================================================
   SEÇÃO 11 — BOTÕES DO VISOR: FAVORITAR E COMPARAR
   ========================================================================== */

/* Botão de favoritar: guarda ou remove o Pokémon INTEIRO do localStorage (HU03)
   e atualiza o texto do botão. */
botaoFavorito.addEventListener('click', function () {
  if (!pokemonAtual) return;
  alternarFavorito(pokemonAtual);
  atualizarBotaoFavorito();
});

/* Botão de comparar: adiciona ou remove o Pokémon da comparação. Se a lista já
   tiver 6, mostra um alerta e não adiciona. Depois atualiza o botão e o
   contador do topo. */
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


/* ==========================================================================
   SEÇÃO 12 — EFEITO DE BRILHO AO TROCAR NORMAL/SHINY
   O clarão atinge todos os sprites da tela, um pouco depois do outro, e a luz
   parece "correr" pela linha evolutiva. As faíscas aparecem só na imagem
   grande e SÓ na ida para o shiny (voltar ao normal não precisa disso).
   Os estilos das animações estão em css/style.css (.cintilando e .faisca).
   ========================================================================== */

/* Quantidade de faíscas que estouram em volta do Pokémon. */
const QUANTAS_FAISCAS = 7;

/* Dispara o clarão em UM sprite, com um atraso (em milissegundos) antes de começar.
   Para a animação recomeçar sempre do zero, a antiga é cancelada explicitamente;
   apenas tirar e recolocar a classe às vezes não reinicia, porque o navegador
   junta as duas mudanças e não percebe diferença. */
function darClarao(sprite, atraso) {
  sprite.classList.remove('cintilando');

  sprite.getAnimations().forEach(animacao => animacao.cancel());

  sprite.style.setProperty('--atraso-brilho', atraso + 'ms');
  void sprite.offsetWidth;
  sprite.classList.add('cintilando');
}

/* Dispara o clarão em todos os sprites (imagem grande + linha evolutiva), cada
   um 70 ms depois do anterior. */
function brilharTudo() {
  const sprites = [imagemEl].concat(spritesDaEvolucao());
  sprites.forEach((sprite, i) => darClarao(sprite, i * 70));
}

/* Cria as faíscas em posições aleatórias em volta da imagem grande. Elas
   nascem, brilham e são apagadas do HTML depois de 1,2 segundo (não sobra lixo
   na tela). */
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

/* Remove do visor todas as faíscas que ainda estiverem na tela. */
function limparBrilho(visor) {
  visor.querySelectorAll('.faisca').forEach(el => el.remove());
}

/* Botão "Ver shiny / Ver normal": liga e desliga a cor rara. Troca a imagem
   grande e a linha evolutiva juntas, dispara o clarão e, se estiver indo para o
   shiny, solta as faíscas. */
botaoShiny.addEventListener('click', function () {
  modoShiny = !modoShiny;
  botaoShiny.textContent = modoShiny ? 'Ver normal' : 'Ver shiny';
  botaoShiny.setAttribute('aria-pressed', String(modoShiny));

  trocarSprites();
  brilharTudo();

  if (modoShiny) soltarFaiscas();
});


/* ==========================================================================
   SEÇÃO 13 — INICIALIZAÇÃO
   ========================================================================== */

/* Botão "Tentar novamente" da tela de erro: recarrega os detalhes. */
botaoTentar.addEventListener('click', carregarDetalhes);

/* Ao abrir a página, já carrega o Pokémon. */
carregarDetalhes();
