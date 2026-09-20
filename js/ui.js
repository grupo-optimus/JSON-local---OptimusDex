/* ==========================================================================
   ARQUIVO: js/ui.js
   OBJETIVO: peças de tela reutilizadas por várias páginas: criar elementos,
             cards de Pokémon, botões de favoritar/comparar, botão "Voltar" e
             botão que limpa a busca.
   CUIDADO DE SEGURANÇA: os elementos são montados com createElement e
             textContent (e não com innerHTML), assim um texto vindo de fora
             nunca vira código dentro da página.
   USADO POR: index, detalhes, favoritos, comparar e sobre-projeto.
   Observação: no final do arquivo, ligarBotaoVoltar() e ligarLimparBusca()
   são executadas sozinhas assim que o arquivo carrega.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — FUNÇÕES AUXILIARES
   ========================================================================== */

/* Cria um elemento HTML (tag) e, se receber texto, coloca-o dentro dele. */
function elemento(tag, texto) {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* Mostra ou esconde um elemento (usa o atributo "hidden"). */
function mostrar(el, visivel) {
  if (el) el.hidden = !visivel;
}

/* Formata o número da Pokédex com três dígitos. Ex.: 1 vira "#001". */
function numeroFormatado(id) {
  return '#' + String(id).padStart(3, '0');
}

/* Lê um parâmetro do endereço da página. Ex.: em "detalhes.html?id=25",
   parametroDaURL('id') devolve "25". */
function parametroDaURL(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}


/* ==========================================================================
   SEÇÃO 2 — PLAQUINHAS DE TIPO
   ========================================================================== */

/* Cria o bloco com uma plaquinha colorida para cada tipo (Fogo, Água, ...).
   O nome do tipo também vai no atributo data-tipo: é por ele que o CSS
   escolhe a cor de cada plaquinha. */
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


/* ==========================================================================
   SEÇÃO 3 — BOTÃO DE FAVORITAR (a estrela no canto do card, RF004)
   ========================================================================== */

/* Cria a estrela de favoritar. Serve para guardar o Pokémon sem abrir a tela
   de detalhes. Guarda o Pokémon inteiro (HU03).
   Só a estrela aparece; o texto fica no title e no aria-label para quem usa
   leitor de tela. A função interna pintar() atualiza o visual (★ ou ☆). */
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

  /* O card inteiro é um link. Sem preventDefault e stopPropagation, clicar na
     estrela também abriria a tela de detalhes. */
  botao.addEventListener('click', function (evento) {
    evento.preventDefault();
    evento.stopPropagation();
    alternarFavorito(pokemon);
    pintar();
  });

  pintar();
  return botao;
}


/* ==========================================================================
   SEÇÃO 4 — BOTÃO DE COMPARAR E CONTADOR "Comparar (n/6)"
   ========================================================================== */

/* Atualiza o texto de todos os links "Comparar (n/6)" da página com a
   quantidade atual de Pokémon selecionados. */
function atualizarLinksComparacao() {
  const quantidade = lerComparacao().length;
  document.querySelectorAll('.link-comparacao').forEach(function (link) {
    link.textContent = 'Comparar (' + quantidade + '/6)';
  });
}

/* Cria o botão "Comparar" do card. Ao clicar, adiciona ou remove o Pokémon da
   comparação. Se já houver 6, mostra um alerta e não adiciona. */
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


/* ==========================================================================
   SEÇÃO 5 — CARD DE POKÉMON
   ========================================================================== */

/* Monta o card de um Pokémon (número, nome, imagem e tipos). Usado na lista
   da tela inicial e na tela de favoritos.
   O segundo parâmetro (opcoes) escolhe quais botões aparecem no card:
     comBotaoFavorito  põe a estrela de favoritar (usado na lista);
     comBotaoRemover   põe o botão "Remover dos favoritos" (usado nos favoritos);
     aoRemover         função chamada depois de remover (a tela se redesenha).
   O botão "Comparar" aparece em todos os cards. */
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

  /* Número e nome ficam em <span> separados para o CSS dar uma cor a cada um. */
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


/* ==========================================================================
   SEÇÃO 6 — BOTÃO "VOLTAR" (volta para o estado em que a lista estava)
   Objetivo: ao voltar da tela de detalhes, a pessoa retorna à lista COMO ELA
   ESTAVA (página 2, busca por "charizard", filtro de lendários...) e não ao
   começo da Pokédex.
   Como funciona: a tela da lista anota o próprio endereço no sessionStorage a
   cada mudança; o botão Voltar lê essa anotação e vai direto para lá.
   Por que não usar só history.back()? Porque ele depende de quem está "atrás"
   no histórico. Se a pessoa foi de um Pokémon para outro pela linha evolutiva,
   o "atrás" seria outro Pokémon e não a lista.
   ========================================================================== */

/* Nome da "gaveta" do sessionStorage onde o último endereço da lista fica. */
const CHAVE_ULTIMA_LISTA = 'optimusdex:ultima-lista';

/* Anota o endereço atual da lista. Chamada por pagina-lista.js a cada mudança
   de página, busca ou filtro. */
function guardarUltimaLista(endereco) {
  try {
    window.sessionStorage.setItem(CHAVE_ULTIMA_LISTA, endereco);
  } catch (erro) {
    /* Navegador bloqueou o armazenamento: nada a fazer. O botão Voltar
       continua funcionando pelo href="index.html" do HTML. */
  }
}

/* Lê o último endereço anotado (texto vazio se não houver). */
function lerUltimaLista() {
  try {
    return window.sessionStorage.getItem(CHAVE_ULTIMA_LISTA) || '';
  } catch (erro) {
    return '';
  }
}

/* Liga o botão "◀ Pokédex" (id "btn-voltar") ao endereço anotado.
   - Se a página não tiver o botão, não faz nada.
   - Se não houver anotação (link aberto direto ou aba nova), o href="index.html"
     que já está no HTML resolve.
   - Se houver, troca o href pelo endereço certo e, ao clicar, volta pelo
     histórico (quando a lista é a página anterior, o que preserva a rolagem)
     ou vai direto para o endereço. */
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


/* ==========================================================================
   SEÇÃO 7 — BOTÃO "X" QUE LIMPA A BUSCA
   O "X" nativo do navegador não aceita ser redesenhado, então o CSS o esconde
   e este botão toma o lugar dele.
   Aparecer ou sumir é responsabilidade do CSS (pelo :placeholder-shown); aqui
   só fica o que acontece no clique.
   ========================================================================== */
function ligarLimparBusca() {
  document.querySelectorAll('.campo-busca').forEach(function (caixa) {
    const campo = caixa.querySelector('input[type="search"]');
    const botao = caixa.querySelector('.btn-limpar-busca');
    if (!campo || !botao) return;

    botao.addEventListener('click', function () {
      campo.value = '';

      /* Dispara o evento "input" para quem filtra enquanto se digita (tela de
         favoritos) perceber que o campo esvaziou. */
      campo.dispatchEvent(new Event('input', { bubbles: true }));

      campo.focus();
    });
  });
}


/* ==========================================================================
   SEÇÃO 8 — EXECUÇÃO AUTOMÁTICA
   Estas duas linhas rodam quando o arquivo carrega, em todas as páginas.
   ========================================================================== */
ligarBotaoVoltar();
ligarLimparBusca();
