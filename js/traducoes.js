/* ==========================================================================
   ARQUIVO: js/traducoes.js
   OBJETIVO: traduzir os tipos de Pokémon (inglês -> português) e padronizar
             textos para a busca.
   USADO POR: todas as páginas que mostram Pokémon ou fazem busca
              (index, detalhes, comparar e favoritos).
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — DICIONÁRIO DE TIPOS
   Objetivo: guardar o nome de cada tipo em inglês (chave usada nos dados e nas
   contas) e o nome que aparece na tela em português.
   ========================================================================== */
const TIPOS_PT = {
  normal: 'Normal',      fighting: 'Lutador',  flying: 'Voador',
  poison: 'Venenoso',    ground: 'Terrestre',  rock: 'Pedra',
  bug: 'Inseto',         ghost: 'Fantasma',    steel: 'Aço',
  fire: 'Fogo',          water: 'Água',        grass: 'Grama',
  electric: 'Elétrico',  psychic: 'Psíquico',  ice: 'Gelo',
  dragon: 'Dragão',      dark: 'Sombrio',      fairy: 'Fada',
  stellar: 'Estelar',    unknown: 'Desconhecido'
};


/* ==========================================================================
   SEÇÃO 2 — FUNÇÕES DE TEXTO
   ========================================================================== */

/* Deixa um texto "bonito": troca traço por espaço e põe cada palavra com
   inicial maiúscula. Ex.: "solar-power" vira "Solar Power".
   Só é usada como plano B quando um tipo não está no dicionário acima. */
function arrumarTexto(texto) {
  return texto
    .split('-')
    .map(pedaco => pedaco.charAt(0).toUpperCase() + pedaco.slice(1))
    .join(' ');
}

/* Recebe o tipo em inglês ("fire") e devolve em português ("Fogo").
   Se o tipo não existir no dicionário, usa arrumarTexto como reserva. */
function traduzirTipo(nomeIngles) {
  return TIPOS_PT[nomeIngles] || arrumarTexto(nomeIngles);
}

/* Prepara um texto para comparação na busca: tudo minúsculo, sem acento e sem
   espaços nas pontas. Ex.: "Pokémon" vira "pokemon".
   normalize('NFD') separa a letra do acento; o replace apaga só o acento.
   Assim "pikachu", "PIKACHU" e "Pikáchu" são tratados como iguais. */
function normalizarTexto(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
