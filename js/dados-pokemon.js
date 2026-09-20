/* ==========================================================================
   ARQUIVO: js/dados-pokemon.js
   OBJETIVO: é o "banco de dados" do projeto. Todos os Pokémon e a tabela de
             efetividade de tipos estão escritos aqui, direto no código.
             Não existe nenhum pedido de rede (não há API).
   USADO POR: pokedex.js, que transforma estes dados no que as telas usam.

   Como adicionar um Pokémon: acrescente um bloco em POKEMONS e coloque os dois
   sprites em img/pokemon/NUMERO.png e img/pokemon/shiny/NUMERO.png.
   ========================================================================== */


/* ==========================================================================
   SEÇÃO 1 — LISTA DE POKÉMON
   Cada Pokémon é um objeto com os campos abaixo:
     id          número da Pokédex Nacional
     chave       nome em minúsculo e sem espaço; serve como identificador
     nome        como aparece na tela
     tipos       chaves de TIPOS_PT (traducoes.js), na ordem oficial
     habilidades lista de habilidades (já em português)
     atributos   os seis atributos-base (hp, ataque, defesa, ...)
     familia     Pokémon com a mesma família formam a linha evolutiva
     estagio     1 = forma inicial, 2 = primeira evolução, 3 = segunda
     requisito   (opcional) o que fazer para chegar neste estágio
     historia    texto da entrada da Pokédex
   ========================================================================== */
const POKEMONS = [
  {
    id: 1,
    chave: 'bulbasaur',
    nome: 'Bulbasaur',
    tipos: ['grass', 'poison'],
    habilidades: ['Supercrescimento', 'Clorofila'],
    atributos: { hp: 45, ataque: 49, defesa: 49, ataqueEspecial: 65, defesaEspecial: 65, velocidade: 45 },
    familia: 'bulbasaur',
    estagio: 1,
    historia: 'Nasce com uma semente presa às costas. O bulbo absorve a luz do sol e ' +
      'cresce junto com o Pokémon, guardando a energia que ele usa no dia a dia.'
  },
  {
    id: 4,
    chave: 'charmander',
    nome: 'Charmander',
    tipos: ['fire'],
    habilidades: ['Chama Viva', 'Poder Solar'],
    atributos: { hp: 39, ataque: 52, defesa: 43, ataqueEspecial: 60, defesaEspecial: 50, velocidade: 65 },
    familia: 'charmander',
    estagio: 1,
    historia: 'A chama na ponta da cauda mostra como ele está: arde forte quando está ' +
      'animado e fica fraca quando está cansado. Prefere lugares quentes.'
  },
  {
    id: 7,
    chave: 'squirtle',
    nome: 'Squirtle',
    tipos: ['water'],
    habilidades: ['Torrente', 'Prato de Chuva'],
    atributos: { hp: 44, ataque: 48, defesa: 65, ataqueEspecial: 50, defesaEspecial: 64, velocidade: 43 },
    familia: 'squirtle',
    estagio: 1,
    historia: 'Quando se sente ameaçado, recolhe-se no casco e revida com jatos de água. ' +
      'O casco arredondado corta a água e o ajuda a nadar bem rápido.'
  },
  {
    id: 25,
    chave: 'pikachu',
    nome: 'Pikachu',
    tipos: ['electric'],
    habilidades: ['Estática', 'Para-raios'],
    atributos: { hp: 35, ataque: 55, defesa: 40, ataqueEspecial: 50, defesaEspecial: 50, velocidade: 90 },
    familia: 'pichu',
    estagio: 2,
    historia: 'Guarda eletricidade nas bochechas vermelhas e a solta em descargas quando ' +
      'se irrita. Um grupo de Pikachu junto pode acumular energia para uma tempestade de raios.'
  }
];


/* ==========================================================================
   SEÇÃO 2 — TABELA DE EFETIVIDADE DE TIPOS
   Como ler: a chave de fora é o tipo do GOLPE (atacante); a chave de dentro é o
   tipo de quem LEVE o golpe (defensor).
   Só aparecem os casos diferentes do normal (1x):
     2   = super efetivo
     0.5 = pouco efetivo
     0   = não faz efeito
   Quem usa: efetividadeContra() e obterVantagensEFraquezas() em pokedex.js.
   ========================================================================== */
const EFETIVIDADE = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};
