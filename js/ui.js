/* SEÇÃO 1 — FUNÇÕES AUXILIARES: criar elemento, mostrar/esconder, formatar número e ler a URL */
function elemento(tag, texto) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function mostrar(el, visivel) {
  if (el) el.hidden = !visivel;
}

function numeroFormatado(id) {
  return '#' + String(id).padStart(3, '0');
}

function parametroDaURL(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

/* SEÇÃO 2 — PLAQUINHAS DE TIPO: etiquetas coloridas de tipo */
function criarPlacasDeTipo(tipos) {
  const caixa = elemento('p');
  caixa.className = 'tipos';

  tipos.forEach(function (tipo) {
    const placa = elemento('span', tipo);
    placa.className = 'tipo';
    placa.dataset.tipo = tipo;
    caixa.appendChild(placa);
  });

  return caixa;
}

/* SEÇÃO 3 — BOTÃO FAVORITAR: estrela do card */
function criarBotaoFavorito(pokemon) {
  const botao = elemento('button');
  botao.type = 'button';
  botao.className = 'estrela-favorito';

  function pintar() {
    const favorito = estaFavoritado(pokemon.id);
    const texto = favorito
      ? 'Remover ' + pokemon.nome + ' dos favoritos'
      : 'Adicionar ' + pokemon.nome + ' aos favoritos';

    botao.textContent = favorito ? '★' : '☆';
    botao.setAttribute('aria-pressed', String(favorito));
    botao.setAttribute('aria-label', texto);
    botao.title = texto;
  }

  botao.addEventListener('click', function (evento) {
    evento.preventDefault();
    evento.stopPropagation();
    alternarFavorito(pokemon);
    pintar();
  });

  pintar();
  return botao;
}

/* SEÇÃO 4 — BOTÃO COMPARAR: botão do card e contador Comparar (n/6) */
function atualizarLinksComparacao() {
  const quantidade = lerComparacao().length;
  document.querySelectorAll('.link-comparacao').forEach(function (link) {
    link.textContent = 'Comparar (' + quantidade + '/6)';
  });
}

function criarBotaoComparacao(pokemon) {
  const botao = elemento('button');
  botao.type = 'button';
  botao.className = 'botao-comparar';

  function pintar() {
    const selecionado = estaNaComparacao(pokemon.id);
    botao.textContent = selecionado ? '✓ Comparando' : 'Comparar';
    botao.setAttribute('aria-pressed', String(selecionado));
    botao.title = selecionado
      ? 'Remover ' + pokemon.nome + ' da comparação'
      : 'Adicionar ' + pokemon.nome + ' à comparação';
  }

  botao.addEventListener('click', function (evento) {
    evento.preventDefault();
    evento.stopPropagation();

    const resultado = alternarComparacao(pokemon);
    if (resultado.cheia) {
      window.alert('A comparação já possui 6 Pokémon. Remova um para adicionar outro.');
      return;
    }

    pintar();
    atualizarLinksComparacao();
  });

  pintar();
  return botao;
}

/* SEÇÃO 5 — CARD DE POKÉMON: monta o card usado na lista e nos favoritos */
function criarCardPokemon(pokemon, opcoes) {
  opcoes = opcoes || {};

  const item = elemento('li');
  const card = elemento('article');

  const link = elemento('a');
  link.href = 'detalhes.html?id=' + pokemon.id;

  const img = elemento('img');
  img.src = pokemon.imagem;
  img.alt = pokemon.nome;
  img.width = 146;
  img.height = 146;
  img.loading = 'lazy';

  const titulo = elemento('h3');
  const numero = elemento('span', numeroFormatado(pokemon.id));
  numero.className = 'dex-numero';
  const nome = elemento('span', pokemon.nome);
  nome.className = 'dex-nome';
  titulo.appendChild(numero);
  titulo.appendChild(nome);

  link.appendChild(img);
  link.appendChild(titulo);
  card.appendChild(link);

  card.appendChild(criarPlacasDeTipo(pokemon.tipos));

  if (opcoes.comBotaoFavorito) {
    card.appendChild(criarBotaoFavorito(pokemon));
  }

  if (opcoes.comBotaoRemover) {
    const botao = elemento('button', '✖ Remover dos favoritos');
    botao.type = 'button';
    botao.addEventListener('click', function () {
      removerFavorito(pokemon.id);
      if (opcoes.aoRemover) opcoes.aoRemover();
    });
    card.appendChild(botao);
  }

  card.appendChild(criarBotaoComparacao(pokemon));

  item.appendChild(card);
  return item;
}

/* SEÇÃO 6 — BOTÃO VOLTAR: volta para a lista no estado em que estava */
const CHAVE_ULTIMA_LISTA = 'optimusdex:ultima-lista';

function guardarUltimaLista(endereco) {
  try {
    window.sessionStorage.setItem(CHAVE_ULTIMA_LISTA, endereco);
  } catch (erro) {

  }
}

function lerUltimaLista() {
  try {
    return window.sessionStorage.getItem(CHAVE_ULTIMA_LISTA) || '';
  } catch (erro) {
    return '';
  }
}

function ligarBotaoVoltar() {
  const botao = document.getElementById('btn-voltar');
  if (!botao) return;

  const destino = lerUltimaLista();

  if (!destino) return;

  botao.href = destino;

  botao.addEventListener('click', function (evento) {
    evento.preventDefault();

    if (document.referrer === destino) {
      window.history.back();
    } else {
      window.location.href = destino;
    }
  });
}

/* SEÇÃO 7 — BOTÃO X DA BUSCA: limpa o campo de busca */
function ligarLimparBusca() {
  document.querySelectorAll('.campo-busca').forEach(function (caixa) {
    const campo = caixa.querySelector('input[type="search"]');
    const botao = caixa.querySelector('.btn-limpar-busca');
    if (!campo || !botao) return;

    botao.addEventListener('click', function () {
      campo.value = '';

      campo.dispatchEvent(new Event('input', { bubbles: true }));

      campo.focus();
    });
  });
}

/* SEÇÃO 8 — EXECUÇÃO AUTOMÁTICA: liga o botão Voltar e o botão X ao carregar */
ligarBotaoVoltar();
ligarLimparBusca();
