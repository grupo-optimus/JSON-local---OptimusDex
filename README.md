# PokéLista — Projeto 01

Front-end em HTML + JavaScript puro (sem framework, sem build, sem dependência) para listar,
buscar, detalhar, comparar e favoritar Pokémons. Todos os dados ficam no próprio projeto: não há
nenhuma chamada de rede.

**Integrantes:** Cauê Vergopolan Hanzen · Andre Luis Castelhano · Carlos Henrique da Silva Menger Neto · Pedro Pimentel Perdomo · Guilherme da Cunha Bonetto

---

## 1. Como rodar

Não precisa de servidor nem de internet: basta abrir o `index.html` no navegador.

Se preferir servir por HTTP (fica igual a um site publicado), suba um servidor simples na pasta
do projeto:

```bash
# Python (já vem instalado na maioria das máquinas)
python3 -m http.server 8000

# ou Node
npx serve .
```

Depois abra `http://localhost:8000`. Sem internet, só as fontes do Google Fonts deixam de
carregar (veja a seção 8).

---

## 2. Estrutura dos arquivos

```
.
├── index.html               Tela 1 — lista + busca + filtros
├── detalhes.html            Tela 2 — detalhes de um Pokémon
├── favoritos.html           Tela 3 — favoritos salvos
├── comparar.html            Tela 4 — comparação de até 6 Pokémon
├── sobre-projeto.html       Tela 5 — sobre o projeto
├── css/
│   └── style.css            Tema visual (FireRed/LeafGreen em modo escuro)
├── img/
│   └── pokemon/             Sprites: NÚMERO.png (normal) e shiny/NÚMERO.png
└── js/
    ├── dados-pokemon.js     OS DADOS: Pokémon cadastrados + tabela de tipos
    ├── pokedex.js           ÚNICA camada que lê os dados
    ├── traducoes.js         Nomes dos tipos em PT-BR + normalização de texto
    ├── dados-filtro.js      Tabelas fixas do filtro (regiões, categorias, lendários)
    ├── favoritos.js         Persistência local (localStorage)
    ├── comparacao.js        Seleção da comparação (sessionStorage)
    ├── ui.js                Pedaços de tela reutilizados (card, formatação)
    ├── pagina-lista.js      Controlador da tela 1
    ├── pagina-detalhes.js   Controlador da tela 2
    ├── pagina-favoritos.js  Controlador da tela 3
    ├── pagina-comparacao.js Controlador da tela 4
    └── pagina-sobre.js      Controlador da tela 5
```

A regra de organização é simples: **nenhuma tela lê os dados diretamente.** Tudo passa por
[js/pokedex.js](js/pokedex.js). Se a fonte dos dados mudar amanhã, só esse arquivo precisa mudar.

---

## 3. Os dados

### Os Pokémon cadastrados

Hoje a Pokédex tem **4 Pokémon**: os três iniciais de Kanto e o Pikachu.

| # | Pokémon | Tipos |
|---|---|---|
| 001 | Bulbasaur | Grama / Venenoso |
| 004 | Charmander | Fogo |
| 007 | Squirtle | Água |
| 025 | Pikachu | Elétrico |

Cada um é um bloco no array `POKEMONS`, em [js/dados-pokemon.js](js/dados-pokemon.js):

```js
{
  id: 25,
  chave: 'pikachu',
  nome: 'Pikachu',
  tipos: ['electric'],
  habilidades: ['Estática', 'Para-raios'],
  atributos: { hp: 35, ataque: 55, defesa: 40, ataqueEspecial: 50, defesaEspecial: 50, velocidade: 90 },
  familia: 'pichu',
  estagio: 2,
  historia: 'Guarda eletricidade nas bochechas vermelhas...'
}
```

O que aparece na tela (nome, habilidades, história) já está em português. Os tipos ficam pela
chave oficial em inglês (`fire`, `water`...), porque é ela que o filtro e a tabela de tipos usam;
[js/traducoes.js](js/traducoes.js) traduz na hora de mostrar (**RNF005**).

### Como cadastrar mais um Pokémon

1. Acrescente um bloco no `POKEMONS`.
2. Coloque os sprites em `img/pokemon/NÚMERO.png` e `img/pokemon/shiny/NÚMERO.png`.

Pronto: lista, busca, filtros, detalhes e comparação já enxergam o novo Pokémon.

Para a **linha evolutiva** aparecer, os Pokémon da mesma cadeia precisam ter a mesma `familia` e
o `estagio` certo. O campo opcional `requisito` diz como se chega naquele estágio:

```js
{ id: 2, chave: 'ivysaur', nome: 'Ivysaur', /* ... */ familia: 'bulbasaur', estagio: 2, requisito: 'Chegar ao nível 16' }
```

### Tabela de tipos

Fraquezas, resistências e imunidades saem da tabela `EFETIVIDADE`, no mesmo arquivo. Cada linha é
o tipo do golpe e só lista o que foge do normal (`2`, `0.5` ou `0`). Num Pokémon de dois tipos, os
multiplicadores se multiplicam: Fogo contra Bulbasaur (Grama/Venenoso) dá `2 × 1 = 2x`, fraqueza.

---

## 4. A camada de dados — `pokedex.js`

As telas só conhecem estas funções:

| Função | Para quê | Requisito |
|---|---|---|
| `listarPagina(n)` | Uma página da lista, 20 por vez | RF001 |
| `obterPokemon(idOuNome)` | Um Pokémon pelo número (`25`, `"025"`) ou pelo nome | RF002, RF003 |
| `buscarPokemons(termo)` | Busca por número ou pedaço do nome | RF002 |
| `obterVariosPokemons(numeros)` | Vários Pokémon de uma vez (página filtrada) | Filtro |
| `filtrarPokemons(filtros)` | Números que passam nos filtros de tipo, região e categoria | Filtro |
| `obterVantagensEFraquezas(pokemon)` | Fraquezas, resistências, imunidades e contra quem é super efetivo | Detalhes |
| `obterLinhaEvolutiva(idOuNome)` | Os estágios da família do Pokémon | Linha evolutiva |
| `obterHistoriaPokemon(idOuNome)` | O texto da Pokédex | Detalhes |

Todas são `async`, mesmo lendo dados que já estão na memória. É de propósito: as telas usam
`await` e não precisam saber de onde o dado vem.

### O modelo que as telas recebem

`paraModelo()` converte o registro de `dados-pokemon.js` no objeto que as telas usam:

```js
{
  id: 25,
  chave: 'pikachu',
  nome: 'Pikachu',
  imagem: 'img/pokemon/25.png',
  imagemShiny: 'img/pokemon/shiny/25.png',
  tiposIngles: ['electric'],
  tipos: ['Elétrico'],
  habilidades: ['Estática', 'Para-raios'],
  atributos: [ { nome: 'HP', valor: 35 }, ... ]
}
```

Esse é o **único formato** que as telas conhecem.

### Busca sem acento e sem maiúscula (RF002)

```js
function normalizarTexto(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')                  // separa a letra do acento: "é" -> "e" + "´"
    .replace(/[̀-ͯ]/g, '')   // joga os acentos fora
    .trim();
}
```

Assim `"Pokémon"`, `"pokemon"` e `"POKÉMON"` viram todos `"pokemon"` e casam entre si.

### Como a busca decide o que fazer

```js
if (/^\d+$/.test(alvo)) {
  return [await obterPokemon(alvo)];                      // só dígitos -> número da Pokédex
}
return TODOS_OS_POKEMONS
  .filter(p => normalizarTexto(p.nome).includes(alvo))    // senão -> pedaço do nome
  .slice(0, TAMANHO_PAGINA);
```

A busca aceita nome parcial: `"char"` acha Charmander.

---

## 5. Persistência dos favoritos (RF005 / RNF001)

Favoritos ficam no **`localStorage`** do navegador — armazenamento local, por domínio, sem
tamanho fixo garantido (~5 MB na prática), que **sobrevive a fechar o navegador**. Não há login
nem back-end.

`localStorage` só guarda **texto**, então:

```js
localStorage.setItem(CHAVE, JSON.stringify(lista));   // objeto -> texto
JSON.parse(localStorage.getItem(CHAVE));              // texto  -> objeto
```

Guardamos o **objeto inteiro** (imagem, tipos, atributos), não só o id — é o que a **HU03** pede.
Consequência prática: a tela de favoritos nem carrega `pokedex.js`; os cards saem direto do que
foi guardado.

Toda leitura está dentro de `try/catch`, porque o `localStorage` pode falhar (modo privado,
navegador bloqueando armazenamento, JSON corrompido). Na dúvida, devolve lista vazia — melhor
uma lista vazia do que uma tela quebrada.

### O outro armazenamento: `sessionStorage` e o botão Voltar

O estado da lista (busca, filtros, página) vive na **URL** — `index.html?q=charmander`,
`index.html?tipo=fire&pagina=1`. A cada mudança, `sincronizarURL()` reescreve o endereço
com `history.replaceState` e anota esse endereço no **`sessionStorage`**.

O botão **Voltar** da tela de detalhes lê essa anotação e vai direto para lá. Não usamos apenas
`history.back()` porque `back()` depende de quem está atrás no histórico: se a pessoa pulou de um
Pokémon para outro pela linha evolutiva, o "atrás" é outro Pokémon, e não a lista. Quando a lista
*é* mesmo a tela anterior, aí sim usamos `back()`, que devolve a posição da rolagem de graça.

Diferença dos favoritos: `sessionStorage` morre ao fechar a aba, que é exatamente o tempo de vida
que essa informação precisa ter.

---

## 6. Estados de tela

Cada tela tem estados mutuamente exclusivos, controlados pelo atributo `hidden`:

| Estado | Quando |
|---|---|
| `carregando` | Montando a tela (com os dados locais, dura um instante) |
| `pronto` | Dados na tela |
| `vazio` | Deu certo, mas não veio nada (busca sem resultado / nenhum favorito) |
| `erro` | Algo falhou — mostra mensagem + "Tentar novamente" (RF007) |

O botão "Tentar novamente" guarda a **última ação** que falhou e a repete:

```js
let ultimaAcao = null;
async function carregarPagina(pagina) {
  ultimaAcao = () => carregarPagina(pagina);   // guarda como refazer
  ...
}
botaoTentar.addEventListener('click', () => { if (ultimaAcao) ultimaAcao(); });
```

Detalhe de UX: buscar um número que não está cadastrado (`150`) lança "Pokémon não encontrado."
Na busca, isso cai no estado `vazio`, não no `erro`.

---

## 7. Rastreabilidade dos requisitos

| ID | Onde está implementado |
|---|---|
| RF001 | `listarPagina()` em [js/pokedex.js](js/pokedex.js) + paginação em [js/pagina-lista.js](js/pagina-lista.js) |
| RF002 | `buscarPokemons()` + `normalizarTexto()` |
| RF003 | `paraModelo()` + tabela de atributos em [js/pagina-detalhes.js](js/pagina-detalhes.js) |
| RF004 | `alternarFavorito()` — botão em detalhes, estrelinha no canto do card e botão remover nos favoritos |
| RF005 | `localStorage` em [js/favoritos.js](js/favoritos.js) |
| RF006 | `#estado-vazio` em [favoritos.html](favoritos.html) |
| RF007 | Estado `erro` + botão "Tentar novamente" |
| RNF001 | `localStorage`, sem login |
| RNF002 | `meta viewport`, HTML fluido, sem largura fixa |
| RNF003 | Dados locais: nenhuma tela espera por rede |
| RNF004 | **Não se aplica mais.** A PokéAPI foi removida; os dados vêm de [js/dados-pokemon.js](js/dados-pokemon.js) |
| RNF005 | Tipos traduzidos em [js/traducoes.js](js/traducoes.js); o resto já está em português nos dados |
| RNF006 | **Não se aplica mais.** O projeto não depende de conexão |

---

## 8. Limitações conhecidas

- **Só 4 Pokémon cadastrados.** Os filtros de outras regiões, de lendários, míticos, Mega e
  Gigantamax continuam na tela, mas hoje devolvem lista vazia.
- **A linha evolutiva não mostra evoluções.** Nenhum dos 4 tem outro Pokémon da mesma família
  cadastrado, então a seção avisa "Nenhuma evolução deste Pokémon está cadastrada." Basta
  cadastrar Ivysaur, Charmeleon etc. (seção 3) para ela aparecer.
- **As duas fontes vêm do Google Fonts.** Sem internet, o navegador troca pelas fontes de sistema
  e o layout continua funcionando, só perde o desenho pixelado.
- **Mega e Gigantamax não combinam com região.** São formas alternativas, fora da faixa de números
  de uma geração. A tela desmarca a região sozinha quando você escolhe uma dessas categorias, e
  avisa o porquê.
- **Favoritos antigos continuam salvos.** Quem favoritou outros Pokémon quando o projeto ainda
  usava a PokéAPI continua vendo esses cards (o objeto inteiro está no `localStorage`), mas o
  detalhe deles mostra "Pokémon não encontrado."
