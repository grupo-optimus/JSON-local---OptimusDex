/* SEÇÃO 1 — ELEMENTOS DO HTML: referências aos elementos da tela por id */
const listaEl    = document.getElementById('lista-favoritos');
const vazioEl    = document.getElementById('estado-vazio');
const semBuscaEl = document.getElementById('sem-resultado');
const contadorEl = document.getElementById('contador');
const campoBusca = document.getElementById('buscaFav');
const formBusca  = document.getElementById('form-busca-fav');

/* SEÇÃO 2 — DESENHAR A TELA: filtra, mostra os cards e escolhe a mensagem exibida */
function desenhar() {
  const termo = normalizarTexto(campoBusca.value);
  const todos = listarFavoritos();

  const visiveis = termo === ''
    ? todos
    : todos.filter(p =>
        normalizarTexto(p.nome).includes(termo) || String(p.id).includes(termo)
      );

  contadorEl.textContent = todos.length + ' favorito(s)';

  listaEl.replaceChildren();
  visiveis.forEach(function (pokemon) {
    listaEl.appendChild(criarCardPokemon(pokemon, {
      comBotaoRemover: true,
      aoRemover: desenhar
    }));
  });

  mostrar(vazioEl,    todos.length === 0);
  mostrar(semBuscaEl, todos.length > 0 && visiveis.length === 0);
  mostrar(listaEl,    visiveis.length > 0);
  atualizarLinksComparacao();
}

/* SEÇÃO 3 — EVENTOS: envio do formulário e digitação na busca */
formBusca.addEventListener('submit', e => { e.preventDefault(); desenhar(); });

campoBusca.addEventListener('input', desenhar);

/* SEÇÃO 4 — INICIALIZAÇÃO: primeiro desenho da tela */
desenhar();
