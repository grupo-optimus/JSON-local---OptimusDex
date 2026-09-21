/* SEÇÃO 1 — ELEMENTOS DO HTML: referências aos elementos da tela por id */
const estadoCarregandoEl = document.getElementById('estado-carregando-comparacao');
const estadoErroEl = document.getElementById('estado-erro-comparacao');
const mensagemErroEl = document.getElementById('mensagem-erro-comparacao');
const estadoVazioEl = document.getElementById('estado-vazio-comparacao');
const tabelaEl = document.getElementById('tabela-comparacao');
const cabecalhoEl = document.getElementById('cabecalho-comparacao');
const corpoEl = document.getElementById('corpo-comparacao');
const botaoLimparEl = document.getElementById('btn-limpar-comparacao');

/* SEÇÃO 2 — ESTADOS DA TELA: carregando, erro, vazio e pronto */
function estadoComparacao(estado, mensagem) {
  mostrar(estadoCarregandoEl, estado === 'carregando');
  mostrar(estadoErroEl, estado === 'erro');
  mostrar(estadoVazioEl, estado === 'vazio');
  mostrar(tabelaEl, estado === 'pronto');
  mostrar(botaoLimparEl, lerComparacao().length > 0);
  if (mensagem) mensagemErroEl.textContent = mensagem;
}

/* SEÇÃO 3 — CÁLCULOS: total de atributos e classe de cor das células */
function totalAtributos(pokemon) {
  return pokemon.atributos.reduce((total, atributo) => total + Number(atributo.valor || 0), 0);
}

function classeComparacao(valor, melhor, pior) {
  if (melhor === pior) return 'comparacao-igual';
  return valor === melhor ? 'comparacao-maior' : 'comparacao-menor';
}

/* SEÇÃO 4 — MONTAR A TABELA: cabeçalho de cada Pokémon e tabela completa */
function criarCabecalhoPokemon(pokemon, ehMelhor) {
  const th = elemento('th');
  th.scope = 'col';

  if (ehMelhor) {
    th.classList.add('comparacao-pokemon-melhor');
    th.setAttribute('aria-label', `${pokemon.nome} — melhor total de atributos-base`);
  }

  const img = elemento('img');
  img.src = pokemon.imagem;
  img.alt = pokemon.nome;
  img.width = 96;
  img.height = 96;
  img.loading = 'lazy';

  const numero = elemento('span', numeroFormatado(pokemon.id));
  numero.className = 'comparacao-numero';
  const nome = elemento('strong', pokemon.nome);

  th.appendChild(img);
  th.appendChild(numero);
  th.appendChild(nome);

  if (ehMelhor) {
    const destaque = elemento('span', 'MELHOR');
    destaque.className = 'comparacao-melhor-badge';
    destaque.setAttribute('aria-hidden', 'true');
    th.appendChild(destaque);
  }

  const remover = elemento('button', '×');
  remover.type = 'button';
  remover.className = 'comparacao-remover';
  remover.setAttribute('aria-label', 'Remover ' + pokemon.nome + ' da comparação');
  remover.title = 'Remover da comparação';
  remover.addEventListener('click', () => {
    removerComparacao(pokemon.id);
    carregarComparacao();
  });

  th.appendChild(remover);
  return th;
}

function desenharComparacao(pokemons) {
  cabecalhoEl.replaceChildren();
  corpoEl.replaceChildren();

  const totais = pokemons.map(totalAtributos);
  const melhorTotal = Math.max(...totais);

  const titulo = elemento('th', 'Atributo');
  titulo.scope = 'col';
  cabecalhoEl.appendChild(titulo);

  pokemons.forEach((pokemon, indice) => {
    const ehMelhor = totais[indice] === melhorTotal;
    cabecalhoEl.appendChild(criarCabecalhoPokemon(pokemon, ehMelhor));
  });

  pokemons[0].atributos.forEach((atributo, indice) => {
    const valores = pokemons.map(pokemon => pokemon.atributos[indice].valor);
    const melhor = Math.max(...valores);
    const pior = Math.min(...valores);

    const tr = elemento('tr');
    tr.appendChild(elemento('th', atributo.nome));

    valores.forEach((valor, pokemonIndice) => {
      const td = elemento('td', String(valor));
      td.className = classeComparacao(valor, melhor, pior);

      if (totais[pokemonIndice] === melhorTotal) {
        td.classList.add('comparacao-coluna-melhor');
      }

      td.title = melhor === pior
        ? 'Empate'
        : valor === melhor
          ? 'Maior valor'
          : 'Menor valor';
      tr.appendChild(td);
    });

    corpoEl.appendChild(tr);
  });

  const linhaTotal = elemento('tr');
  linhaTotal.className = 'comparacao-total';
  linhaTotal.appendChild(elemento('th', 'Total'));

  totais.forEach((total, indice) => {
    const td = elemento('td', String(total));
    td.className = 'comparacao-total-valor';
    if (total === melhorTotal) {
      td.classList.add('comparacao-coluna-melhor');
    }
    td.title = total === melhorTotal ? 'Melhor total de atributos-base' : 'Total de atributos-base';
    linhaTotal.appendChild(td);
  });

  corpoEl.appendChild(linhaTotal);
}

/* SEÇÃO 5 — CARREGAR A COMPARAÇÃO: lê os ids, busca os Pokémon e desenha a tabela */
async function carregarComparacao() {
  const ids = lerComparacao();

  if (ids.length < 2) {
    estadoComparacao('vazio');
    return;
  }

  estadoComparacao('carregando');

  try {
    const pokemons = await Promise.all(ids.map(id => obterPokemon(id)));
    desenharComparacao(pokemons);
    estadoComparacao('pronto');
  } catch (erro) {
    estadoComparacao('erro', erro.message);
  }
}

/* SEÇÃO 6 — EVENTOS E INICIALIZAÇÃO: botão de limpar e primeira carga */
botaoLimparEl.addEventListener('click', function () {
  limparComparacao();
  carregarComparacao();
});

carregarComparacao();
