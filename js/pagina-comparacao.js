/* ==========================================================================
   ARQUIVO: js/pagina-comparacao.js
   OBJETIVO: controla a tela de comparação (comparar.html): compara de 2 a 6
             Pokémon lado a lado pelos seis atributos-base.
   O destaque de "MELHOR" considera a SOMA dos seis atributos de cada Pokémon.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — REFERÊNCIAS AOS ELEMENTOS DO HTML
   ========================================================================== */
const estadoCarregandoEl = document.getElementById('estado-carregando-comparacao');
const estadoErroEl = document.getElementById('estado-erro-comparacao');
const mensagemErroEl = document.getElementById('mensagem-erro-comparacao');
const estadoVazioEl = document.getElementById('estado-vazio-comparacao');
const tabelaEl = document.getElementById('tabela-comparacao');
const cabecalhoEl = document.getElementById('cabecalho-comparacao');
const corpoEl = document.getElementById('corpo-comparacao');
const botaoLimparEl = document.getElementById('btn-limpar-comparacao');


/* ==========================================================================
   SEÇÃO 2 — ESTADOS DA TELA
   ========================================================================== */

/* Liga um estado da tela e desliga os outros: 'carregando', 'erro', 'vazio' ou
   'pronto' (tabela). O botão "Limpar comparação" só aparece se houver algum
   Pokémon selecionado. */
function estadoComparacao(estado, mensagem) {
  mostrar(estadoCarregandoEl, estado === 'carregando');
  mostrar(estadoErroEl, estado === 'erro');
  mostrar(estadoVazioEl, estado === 'vazio');
  mostrar(tabelaEl, estado === 'pronto');
  mostrar(botaoLimparEl, lerComparacao().length > 0);
  if (mensagem) mensagemErroEl.textContent = mensagem;
}


/* ==========================================================================
   SEÇÃO 3 — CÁLCULOS
   ========================================================================== */

/* Soma os seis atributos-base de um Pokémon. */
function totalAtributos(pokemon) {
  return pokemon.atributos.reduce((total, atributo) => total + Number(atributo.valor || 0), 0);
}

/* Decide a classe (cor) de uma célula da tabela:
   - todos iguais -> 'comparacao-igual';
   - maior valor da linha -> 'comparacao-maior';
   - os demais -> 'comparacao-menor'. */
function classeComparacao(valor, melhor, pior) {
  if (melhor === pior) return 'comparacao-igual';
  return valor === melhor ? 'comparacao-maior' : 'comparacao-menor';
}


/* ==========================================================================
   SEÇÃO 4 — MONTAR A TABELA
   ========================================================================== */

/* Cria a célula de cabeçalho de UM Pokémon: imagem, número, nome, selo "MELHOR"
   (se tiver o maior total) e botão "×" para removê-lo da comparação. */
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

/* Monta a tabela completa a partir da lista de Pokémon:
   1. cabeçalho: uma coluna "Atributo" + uma coluna por Pokémon;
   2. uma linha para cada um dos seis atributos, com o maior valor em destaque
      (verde), o menor (vermelho) e, se todos forem iguais, cor neutra;
   3. a última linha "Total" com a soma dos atributos.
   A coluna do Pokémon com maior total recebe destaque extra. */
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


/* ==========================================================================
   SEÇÃO 5 — CARREGAR A COMPARAÇÃO
   ========================================================================== */

/* Lê os ids selecionados, busca cada Pokémon e desenha a tabela.
   - Menos de 2 Pokémon selecionados: mostra o estado "vazio" (precisa de pelo
     menos 2 para comparar).
   - Se algo falhar: mostra o estado de erro. */
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


/* ==========================================================================
   SEÇÃO 6 — EVENTOS E INICIALIZAÇÃO
   ========================================================================== */

/* Botão "Limpar comparação": esvazia a seleção e redesenha a tela. */
botaoLimparEl.addEventListener('click', function () {
  limparComparacao();
  carregarComparacao();
});

/* Ao abrir a página, já carrega a comparação atual. */
carregarComparacao();
