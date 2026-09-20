/* ==========================================================================
   ARQUIVO: js/pagina-favoritos.js
   OBJETIVO: controla a tela de favoritos (favoritos.html). RF006 e RF004.
   OBSERVAÇÃO: esta tela NÃO usa dados-pokemon.js. Como o Pokémon inteiro foi
   salvo no localStorage ao favoritar, os cards saem direto do que foi guardado.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — REFERÊNCIAS AOS ELEMENTOS DO HTML
   ========================================================================== */
const listaEl    = document.getElementById('lista-favoritos');
const vazioEl    = document.getElementById('estado-vazio');
const semBuscaEl = document.getElementById('sem-resultado');
const contadorEl = document.getElementById('contador');
const campoBusca = document.getElementById('buscaFav');
const formBusca  = document.getElementById('form-busca-fav');


/* ==========================================================================
   SEÇÃO 2 — DESENHAR A TELA
   ========================================================================== */

/* Desenha (ou redesenha) a tela inteira de favoritos:
   1. lê a lista salva e o texto digitado na busca;
   2. filtra por nome ou número, ignorando maiúscula e acento;
   3. atualiza o contador "N favorito(s)";
   4. cria um card para cada favorito visível, com botão de remover;
   5. escolhe qual mensagem/lista mostrar:
        - nenhum favorito salvo -> "Nenhum favorito ainda";
        - há favoritos, mas a busca não achou -> "Nenhum favorito com esse nome";
        - caso contrário -> a lista de cards. */
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


/* ==========================================================================
   SEÇÃO 3 — EVENTOS
   ========================================================================== */

/* Enviar o formulário (botão "Buscar" ou Enter) apenas redesenha a lista, sem
   recarregar a página. */
formBusca.addEventListener('submit', e => { e.preventDefault(); desenhar(); });

/* A lista também é filtrada enquanto a pessoa digita. */
campoBusca.addEventListener('input', desenhar);


/* ==========================================================================
   SEÇÃO 4 — INICIALIZAÇÃO
   ========================================================================== */
desenhar();
