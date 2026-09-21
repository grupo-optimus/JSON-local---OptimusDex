/* SEÇÃO 1 — CONSTANTE: chave do localStorage */
const CHAVE_FAVORITOS = 'pokelista:favoritos';

/* SEÇÃO 2 — LEITURA E GRAVAÇÃO: listarFavoritos e salvarFavoritos */
function listarFavoritos() {
  try {
    const texto = localStorage.getItem(CHAVE_FAVORITOS);
    return texto ? JSON.parse(texto) : [];
  } catch (erro) {
    return [];
  }
}

function salvarFavoritos(lista) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
    return true;
  } catch (erro) {
    return false;
  }
}

/* SEÇÃO 3 — OPERAÇÕES: verificar, adicionar, remover e alternar favorito */
function estaFavoritado(id) {
  return listarFavoritos().some(item => item.id === id);
}

function adicionarFavorito(pokemon) {
  const lista = listarFavoritos();
  if (!lista.some(item => item.id === pokemon.id)) {
    lista.push(pokemon);
    lista.sort((a, b) => a.id - b.id);
    salvarFavoritos(lista);
  }
}

function removerFavorito(id) {
  salvarFavoritos(listarFavoritos().filter(item => item.id !== id));
}

function alternarFavorito(pokemon) {
  if (estaFavoritado(pokemon.id)) {
    removerFavorito(pokemon.id);
    return false;
  }
  adicionarFavorito(pokemon);
  return true;
}
