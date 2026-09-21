/* SEÇÃO 1 — REGIÕES: lista de regiões com a faixa de números da Pokédex de cada uma */
const REGIOES = [
  { geracao: 1, nome: 'Kanto',  primeiro: 1,   ultimo: 151  },
  { geracao: 2, nome: 'Johto',  primeiro: 152, ultimo: 251  },
  { geracao: 3, nome: 'Hoenn',  primeiro: 252, ultimo: 386  },
  { geracao: 4, nome: 'Sinnoh', primeiro: 387, ultimo: 493  },
  { geracao: 5, nome: 'Unova',  primeiro: 494, ultimo: 649  },
  { geracao: 6, nome: 'Kalos',  primeiro: 650, ultimo: 721  },
  { geracao: 7, nome: 'Alola',  primeiro: 722, ultimo: 809  },
  { geracao: 8, nome: 'Galar',  primeiro: 810, ultimo: 905  },
  { geracao: 9, nome: 'Paldea', primeiro: 906, ultimo: 1025 }
];

/* SEÇÃO 2 — CATEGORIAS: Lendários, Míticos, Mega e Gigantamax */
const CATEGORIAS = [
  { chave: 'lendario', nome: 'Lendários'   },
  { chave: 'mitico',   nome: 'Míticos'     },
  { chave: 'mega',     nome: 'Mega'        },
  { chave: 'gmax',     nome: 'Gigantamax'  }
];

/* SEÇÃO 3 — NÚMEROS ESPECIAIS: ids dos Pokémon lendários e míticos */
const IDS_LENDARIOS = [
  144, 145, 146, 150,
  243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  638, 639, 640, 641, 642, 643, 644, 645, 646,
  716, 717, 718,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792,
  793, 794, 795, 796, 797, 798, 799, 800, 803, 804, 805, 806,
  888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008,
  1014, 1015, 1016, 1017, 1024
];

const IDS_MITICOS = [
  151,
  251,
  385, 386,
  489, 490, 491, 492, 493,
  494,
  647, 648, 649,
  719, 720, 721,
  801, 802,
  807, 808, 809,
  893,
  1025
];
