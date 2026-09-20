/* ==========================================================================
   ARQUIVO: js/comparacao.js
   OBJETIVO: controlar a lista de Pokémon selecionados para comparação
             (no máximo 6).
   ONDE FICA GUARDADO: no sessionStorage, que sobrevive à troca de página
             enquanto a aba estiver aberta. Assim não é preciso passar uma
             lista enorme de parâmetros pela URL.
             Só os NÚMEROS (ids) são guardados.
   USADO POR: ui.js (botão "Comparar" dos cards), pagina-detalhes.js e
              pagina-comparacao.js.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — CONSTANTES
   ========================================================================== */

/* Nome da "gaveta" do sessionStorage onde a lista de ids é guardada. */
const CHAVE_COMPARACAO = 'optimusdex:comparacao';

/* Limite de Pokémon na comparação. */
const MAX_POKEMONS_COMPARACAO = 6;


/* ==========================================================================
   SEÇÃO 2 — LER E SALVAR NO sessionStorage
   ========================================================================== */

/* Devolve a lista de ids que estão na comparação.
   Faz uma "limpeza" por segurança: converte para número, descarta valores
   inválidos e corta em no máximo 6. Se algo der errado, devolve lista vazia. */
function lerComparacao() {
  try {
    const texto = sessionStorage.getItem(CHAVE_COMPARACAO);
    const ids = texto ? JSON.parse(texto) : [];
    return Array.isArray(ids)
      ? ids.map(Number).filter(id => Number.isInteger(id) && id > 0).slice(0, MAX_POKEMONS_COMPARACAO)
      : [];
  } catch (erro) {
    return [];
  }
}

/* Salva a lista de ids. Devolve true se deu certo e false se deu erro. */
function salvarComparacao(ids) {
  try {
    sessionStorage.setItem(CHAVE_COMPARACAO, JSON.stringify(ids));
    return true;
  } catch (erro) {
    return false;
  }
}


/* ==========================================================================
   SEÇÃO 3 — OPERAÇÕES SOBRE A COMPARAÇÃO
   ========================================================================== */

/* Diz (true/false) se o Pokémon com esse id já está na comparação. */
function estaNaComparacao(id) {
  return lerComparacao().includes(Number(id));
}

/* Tenta adicionar o Pokémon à comparação. Devolve um objeto com:
     sucesso   salvou corretamente?
     adicionou entrou agora na lista? (false se já estava)
     cheia     true se a lista já tem 6 e por isso NÃO foi adicionado */
function adicionarComparacao(pokemon) {
  const ids = lerComparacao();
  const id = Number(pokemon.id);

  if (ids.includes(id)) return { sucesso: true, adicionou: false, cheia: false };
  if (ids.length >= MAX_POKEMONS_COMPARACAO) return { sucesso: false, adicionou: false, cheia: true };

  ids.push(id);
  return { sucesso: salvarComparacao(ids), adicionou: true, cheia: false };
}

/* Remove o Pokémon com esse id da comparação. */
function removerComparacao(id) {
  const ids = lerComparacao().filter(item => item !== Number(id));
  return salvarComparacao(ids);
}

/* Um único botão adiciona e remove: se já está na comparação, remove; senão,
   tenta adicionar. Devolve { selecionado, cheia }, onde "selecionado" diz se o
   Pokémon está na comparação depois da ação e "cheia" avisa que o limite de 6
   foi atingido (a tela usa isso para mostrar um alerta). */
function alternarComparacao(pokemon) {
  if (estaNaComparacao(pokemon.id)) {
    removerComparacao(pokemon.id);
    return { selecionado: false, cheia: false };
  }

  const resultado = adicionarComparacao(pokemon);
  return {
    selecionado: resultado.sucesso && resultado.adicionou,
    cheia: resultado.cheia
  };
}

/* Esvazia a comparação. */
function limparComparacao() {
  return salvarComparacao([]);
}
