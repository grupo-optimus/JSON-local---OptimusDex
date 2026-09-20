/* ==========================================================================
   ARQUIVO: js/favoritos.js
   OBJETIVO: guardar, ler e remover os Pokémon favoritos usando o localStorage
             do navegador (RF005 e RNF001: os dados ficam salvos sem login e
             continuam lá depois de fechar o navegador).
   IMPORTANTE (HU03): é guardado o Pokémon INTEIRO (imagem, tipos, atributos),
             e não só o número. Por isso a tela de favoritos funciona sem
             precisar de dados-pokemon.js.
   USADO POR: ui.js (estrela dos cards), pagina-detalhes.js e pagina-favoritos.js.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — CONSTANTE
   ========================================================================== */

/* Nome da "gaveta" do localStorage onde a lista de favoritos é guardada. */
const CHAVE_FAVORITOS = 'pokelista:favoritos';


/* ==========================================================================
   SEÇÃO 2 — LER E SALVAR NO localStorage
   ========================================================================== */

/* Devolve a lista de favoritos salva. O localStorage só guarda texto, então
   JSON.parse converte o texto de volta em lista de objetos.
   Se o dado estiver corrompido ou o navegador bloquear o acesso, devolve uma
   lista vazia em vez de quebrar a tela. */
function listarFavoritos() {
  try {
    const texto = localStorage.getItem(CHAVE_FAVORITOS);
    return texto ? JSON.parse(texto) : [];
  } catch (erro) {
    return [];
  }
}

/* Salva a lista no localStorage (JSON.stringify converte a lista em texto).
   Devolve true se salvou e false se deu erro. */
function salvarFavoritos(lista) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
    return true;
  } catch (erro) {
    return false;
  }
}


/* ==========================================================================
   SEÇÃO 3 — OPERAÇÕES SOBRE OS FAVORITOS
   ========================================================================== */

/* Diz (true/false) se o Pokémon com esse id já está nos favoritos. */
function estaFavoritado(id) {
  return listarFavoritos().some(item => item.id === id);
}

/* Adiciona o Pokémon aos favoritos (se ainda não estiver) e mantém a lista
   ordenada pelo número da Pokédex. */
function adicionarFavorito(pokemon) {
  const lista = listarFavoritos();
  if (!lista.some(item => item.id === pokemon.id)) {
    lista.push(pokemon);
    lista.sort((a, b) => a.id - b.id);
    salvarFavoritos(lista);
  }
}

/* Remove dos favoritos o Pokémon com esse id. */
function removerFavorito(id) {
  salvarFavoritos(listarFavoritos().filter(item => item.id !== id));
}

/* Um único botão adiciona e remove (RF004): se já é favorito, remove; senão,
   adiciona. Devolve true se o Pokémon ficou favorito e false se saiu. */
function alternarFavorito(pokemon) {
  if (estaFavoritado(pokemon.id)) {
    removerFavorito(pokemon.id);
    return false;
  }
  adicionarFavorito(pokemon);
  return true;
}
