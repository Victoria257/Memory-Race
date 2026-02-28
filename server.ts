import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const categories = ['furniture', 'appliances', 'transport', 'animals', 'food', 'clothing', 'dishes'];
const colors = ['gray', 'black', 'blue', 'yellow', 'green', 'red', 'brown', 'white'];

type Card = {
  id: string;
  category: string;
  color: string;
  itemEn: string;
  itemSv: string;
  itemUk: string;
  colorEn: string;
  colorSv: string;
  colorUk: string;
  imageUrl: string | null;
};

const cardDataCsv = `ID,Ім'я_UK,Ім'я_EN,Ім'я_SV,Категорія_UK,Color_UK,Стовпець 1
1,Диван,Sofa,Soffa,Меблі,Білий,https://i.pinimg.com/736x/2e/3d/47/2e3d47ac0bab22e943718a9b63206d2d.jpg
2,Крісло,Armchair,Fåtölj,Меблі,Чорний,https://i.pinimg.com/1200x/ff/9f/f6/ff9ff68931e3d2a9924d3b8582b42314.jpg
3,Стілець,Chair,Stol,Меблі,Синій,https://i.pinimg.com/1200x/13/5c/69/135c69e33566c4f286b8e06fa1281c01.jpg
4,Стіл,Table,Bord,Меблі,Сірий,https://i.pinimg.com/1200x/96/17/ef/9617effee13648697ef1e22c4828a7a5.jpg
5,Шафа,Wardrobe,Garderob,Меблі,Жовтий,
6,Комод,Dresser,Byrå,Меблі,Зелений,
7,Ліжко,Bed,Säng,Меблі,Червоний,
8,Тумба,Nightstand,Sängbord,Меблі,Коричневий,
9,Полиця,Shelf,Hylla,Меблі,Синій,
10,Табурет,Stool,Pall,Меблі,Чорний,
11,Сундук,Chest,Kista,Меблі,Зелений,
12,Ліжко,Bed,Säng,Меблі,Синій,
13,Комод,Dresser,Byrå,Меблі,Жовтий,
14,Письмовий стіл,Desk,Skrivbord,Меблі,Зелений,
15,Журнальний столик,Coffee Table,Soffbord,Меблі,Червоний,
16,Трюмо,Dressing Table,Sminkbord,Меблі,Синій,
17,Гардероб,Wardrobe,Garderob,Меблі,Білий,
18,Лавка садова,Garden Bench,Trädgårdsbänk,Меблі,Чорний,
19,Банкетка,Ottoman,Puff,Меблі,Сірий,
20,Підставка для взуття,Shoe Rack,Skohylla,Меблі,Синій,
21,Дитяче ліжечко,Crib,Spjälsäng,Меблі,Білий,
22,Шафа-купе,Sliding Wardrobe,Skjutdörrsgarderob,Меблі,Синій,
23,Стелаж,Shelving Unit,Hyllsystem,Меблі,Коричневий,
24,Барний стілець,Bar Stool,Barstol,Меблі,Червоний,
25,Пуф,Pouf,Puff,Меблі,Жовтий,
26,Телефон,Phone,Telefon,Техніка,Чорний,
27,Ноутбук,Laptop,Bärbar dator,Техніка,Сірий,
28,Планшет,Tablet,Surfplatta,Техніка,Синій,
29,Телевізор,TV,TV,Техніка,Сірий,
30,Холодильник,Fridge,Kylskåp,Техніка,Сірий,
31,Мікрохвильовка,Microwave,Mikrovågsugn,Техніка,Червоний,
32,Пилосос,Vacuum Cleaner,Dammsugare,Техніка,Зелений,
33,Пральна машина,Washing Machine,Tvättmaskin,Техніка,Білий,
34,Кавоварка,Coffee Maker,Kaffebryggare,Техніка,Червоний,
35,Чайник електричний,Electric Kettle,Vattenkokare,Техніка,Жовтий,
36,Фен,Hair Dryer,Hårtork,Техніка,Синій,
37,Блендер,Blender,Mixer,Техніка,Жовтий,
38,Тостер,Toaster,Brödrost,Техніка,Зелений,
39,Духовка,Oven,Ugn,Техніка,Чорний,
40,Плита,Stove,Spis,Техніка,Коричневий,
41,Кондиціонер,Air Conditioner,Luftkonditionering,Техніка,Білий,
42,Вентилятор,Fan,Fläkt,Техніка,Чорний,
43,Колонка,Speaker,Högtalare,Техніка,Зелений,
44,Навушники,Headphones,Hörlurar,Техніка,Синій,
45,Камера,Camera,Kamera,Техніка,Жовтий,
46,Принтер,Printer,Skrivare,Техніка,Білий,
47,Сканер,Scanner,Scanner,Техніка,Коричневий,
48,Смарт-годинник,Smartwatch,Smart klocka,Техніка,Червоний,
49,Ігрова приставка,Console,Konsol,Техніка,Чорний,
50,Роутер,Router,Router,Техніка,Чорний,
51,Автомобіль,Car,Bil,Транспорт,Синій,
52,Автобус,Bus,Buss,Транспорт,Сірий,
53,Тролейбус,Trolleybus,Trådbuss,Транспорт,Жовтий,
54,Трамвай,Tram,Spårvagn,Транспорт,Зелений,
55,Потяг,Train,Tåg,Транспорт,Коричневий,
56,Метро,Subway,Tunnelbana,Транспорт,Червоний,
57,Велосипед,Bicycle,Cykel,Транспорт,Білий,
58,Самокат,Scooter,Sparkcykel,Транспорт,Сірий,
59,Мотоцикл,Motorcycle,Motorcykel,Транспорт,Чорний,
60,Літак,Airplane,Flygplan,Транспорт,Синій,
61,Гелікоптер,Helicopter,Helikopter,Транспорт,Жовтий,
62,Корабель,Ship,Skepp,Транспорт,Коричневий,
63,Човен,Boat,Båt,Транспорт,Білий,
64,Яхта,Yacht,Yacht,Транспорт,Синій,
65,Катер,Speedboat,Motorbåt,Транспорт,Червоний,
66,Ракета,Rocket,Raket,Транспорт,Чорний,
67,Вантажівка,Truck,Lastbil,Транспорт,Сірий,
68,Фургон,Van,Skåpbil,Транспорт,Коричневий,
69,Таксі,Taxi,Taxi,Транспорт,Жовтий,
70,Електромобіль,Electric Car,Elbil,Транспорт,Зелений,
71,Трактор,Tractor,Traktor,Транспорт,Зелений,
72,Комбайн,Harvester,Skördetröska,Транспорт,Зелений,
73,Бульдозер,Bulldozer,Bulldozer,Транспорт,Червоний,
74,Причіп,Trailer,Släpvagn,Транспорт,Сірий,
75,Евакуатор,Tow Truck,Bärgningsbil,Транспорт,Синій,
76,Кіт,Cat,Katt,Тварини і птахи,Сірий,
77,Собака,Dog,Hund,Тварини і птахи,Чорний,
78,Корова,Cow,Ko,Тварини і птахи,Білий,
79,Кінь,Horse,Häst,Тварини і птахи,Чорний,
80,Вівця,Sheep,Får,Тварини і птахи,Сірий,
81,Коза,Goat,Get,Тварини і птахи,Білий,
82,Свиня,Pig,Gris,Тварини і птахи,Білий,
83,Лев,Lion,Lejon,Тварини і птахи,Жовтий,
84,Тигр,Tiger,Tiger,Тварини і птахи,Жовтий,
85,Ведмідь,Bear,Björn,Тварини і птахи,Коричневий,
86,Вовк,Wolf,Varg,Тварини і птахи,Чорний,
87,Лисиця,Fox,Räv,Тварини і птахи,Червоний,
88,Заєць,Rabbit,Hare,Тварини і птахи,Сірий,
89,Олень,Deer,Ren,Тварини і птахи,Коричневий,
90,Їжак,Hedgehog,Igelkott,Тварини і птахи,Чорний,
91,Білка,Squirrel,Ekorre,Тварини і птахи,Коричневий,
92,Миша,Mouse,Mus,Тварини і птахи,Білий,
93,Щур,Rat,Råtta,Тварини і птахи,Сірий,
94,Орел,Eagle,Örn,Тварини і птахи,Сірий,
95,Голуб,Pigeon,Duva,Тварини і птахи,Синій,
96,Ворона,Crow,Kråka,Тварини і птахи,Чорний,
97,Папуга,Parrot,Papegoja,Тварини і птахи,Синій,
98,Фламінго,Flamingo,Flamingo,Тварини і птахи,Червоний,
99,Качка,Duck,Anka,Тварини і птахи,Сірий,
100,Півень,Rooster,Tupp,Тварини і птахи,Червоний,
101,Яблуко,Apple,Äpple,Їжа і напої,Червоний,
102,Банан,Banana,Banan,Їжа і напої,Жовтий,
103,Огірок,Cucumber,Gurka,Їжа і напої,Зелений,
104,Помідор,Tomato,Tomat,Їжа і напої,Зелений,
105,Морква,Carrot,Morot,Їжа і напої,Жовтий,
106,Картопля,Potato,Potatis,Їжа і напої,Коричневий,
107,Кукурудза,Corn,Majs,Їжа і напої,Жовтий,
108,Хліб,Bread,Bröd,Їжа і напої,Коричневий,
109,Сир,Cheese,Ost,Їжа і напої,Жовтий,
110,Яйце,Egg,Ägg,Їжа і напої,Білий,
111,Рис,Rice,Ris,Їжа і напої,Білий,
112,Гречка,Buckwheat,Bovete,Їжа і напої,Коричневий,
113,Макарони,Pasta,Pasta,Їжа і напої,Зелений,
114,Шоколад,Chocolate,Choklad,Їжа і напої,Коричневий,
115,Полуниця,Strawberry,Jordgubbe,Їжа і напої,Червоний,
116,Кавун,Watermelon,Vattenmelon,Їжа і напої,Зелений,
117,Виноград,Grapes,Vindruvor,Їжа і напої,Зелений,
118,Чорниця,Blueberry,Blåbär,Їжа і напої,Чорний,
119,Перець,Pepper,Paprika,Їжа і напої,Червоний,
120,Капуста,Cabbage,Kål,Їжа і напої,Зелений,
121,Сік,Juice,Juice,Їжа і напої,Жовтий,
122,Молоко,Milk,Mjölk,Їжа і напої,Білий,
123,Вода,Water,Vatten,Їжа і напої,Синій,
124,Чай,Tea,Te,Їжа і напої,Коричневий,
125,Печиво,Cookie,Kaka,Їжа і напої,Білий,
126,Футболка,T-shirt,T-shirt,Одяг і аксесуари,Червоний,
127,Сорочка,Shirt,Skjorta,Одяг і аксесуари,Коричневий,
128,Джинси,Jeans,Jeans,Одяг і аксесуари,Синій,
129,Куртка,Jacket,Jacka,Одяг і аксесуари,Чорний,
130,Пальто,Coat,Kappa,Одяг і аксесуари,Сірий,
131,Шапка,Hat,Mössa,Одяг і аксесуари,Білий,
132,Шарф,Scarf,Halsduk,Одяг і аксесуари,Жовтий,
133,Рукавиці,Mittens,Vantar,Одяг і аксесуари,Зелений,
134,Шкарпетки,Socks,Strumpor,Одяг і аксесуари,Червоний,
135,Кросівки,Sneakers,Sneakers,Одяг і аксесуари,Білий,
136,Чоботи,Boots,Stövlar,Одяг і аксесуари,Коричневий,
137,Сандалі,Sandals,Sandaler,Одяг і аксесуари,Синій,
138,Сукня,Dress,Klänning,Одяг і аксесуари,Зелений,
139,Спідниця,Skirt,Kjol,Одяг і аксесуари,Чорний,
140,Костюм,Suit,Kostym,Одяг і аксесуари,Жовтий,
141,Краватка,Tie,Slips,Одяг і аксесуари,Сірий,
142,Ремінь,Belt,Bälte,Одяг і аксесуари,Червоний,
143,Капелюх,Hat,Hatt,Одяг і аксесуари,Коричневий,
144,Берет,Beret,Beret,Одяг і аксесуари,Білий,
145,Сумка,Bag,Väska,Одяг і аксесуари,Чорний,
146,Рюкзак,Backpack,Ryggsäck,Одяг і аксесуари,Сірий,
147,Рукавички,Gloves,Handskar,Одяг і аксесуари,Синій,
148,Светр,Sweater,Tröja,Одяг і аксесуари,Жовтий,
149,Худі,Hoodie,Huvtröja,Одяг і аксесуари,Зелений,
150,Кофта на гудзиках,Cardigan,Kofta,Одяг і аксесуари,Червоний,
151,Тарілка,Plate,Tallrik,Посуд,Коричневий,
152,Чашка,Cup,Kopp,Посуд,Білий,
153,Склянка,Glass,Glas,Посуд,Сірий,
154,Келих,Wine Glass,Vinglas,Посуд,Синій,
155,Ложка,Spoon,Sked,Посуд,Білий,
156,Виделка,Fork,Gaffel,Посуд,Чорний,
157,Ніж,Knife,Kniv,Посуд,Червоний,
158,Каструля,Pot,Kastrull,Посуд,Коричневий,
159,Сковорідка,Pan,Stekpanna,Посуд,Червоний,
160,Чайник,Kettle,Tekanna,Посуд,Жовтий,
161,Термос,Thermos,Termos,Посуд,Зелений,
162,Контейнер,Container,Behållare,Посуд,Сірий,
163,Дошка для нарізання,Cutting Board,Skärbräda,Посуд,Синій,
164,Ополоник,Ladle,Slev,Посуд,Жовтий,
165,Віничок,Whisk,Visp,Посуд,Зелений,
166,Лопатка,Spatula,Stekspade,Посуд,Червоний,
167,Форма для випічки,Baking Mold,Bakform,Посуд,Коричневий,
168,Миска,Bowl,Skål,Посуд,Білий,
169,Глечик,Pitcher,Kanna,Посуд,Сірий,
170,Сільничка,Salt Shaker,Saltkar,Посуд,Чорний,
171,Перечниця,Pepper Shaker,Pepparkar,Посуд,Синій,
172,Друшляк,Colander,Durkslag,Посуд,Зелений,
173,Сито,Sieve,Sil,Посуд,Жовтий,
174,Цукорниця,Sugar Bowl,Sockerskål,Посуд,Червоний,
175,Піала,Piala,Piala,Посуд,Коричневий`;

// Generate a simple deck
function generateDeck(): Card[] {
  const categoryMap: Record<string, string> = {
    'Меблі': 'furniture',
    'Техніка': 'appliances',
    'Транспорт': 'transport',
    'Тварини і птахи': 'animals',
    'Їжа і напої': 'food',
    'Одяг і аксесуари': 'clothing',
    'Посуд': 'dishes'
  };

  const colorMap: Record<string, string> = {
    'Білий': 'white',
    'Чорний': 'black',
    'Синій': 'blue',
    'Сірий': 'gray',
    'Жовтий': 'yellow',
    'Зелений': 'green',
    'Червоний': 'red',
    'Коричневий': 'brown'
  };

  const colorNamesEn: Record<string, string> = {
    'white': 'White', 'black': 'Black', 'blue': 'Blue', 'gray': 'Gray',
    'yellow': 'Yellow', 'green': 'Green', 'red': 'Red', 'brown': 'Brown'
  };

  const colorNamesSv: Record<string, string> = {
    'white': 'Vit', 'black': 'Svart', 'blue': 'Blå', 'gray': 'Grå',
    'yellow': 'Gul', 'green': 'Grön', 'red': 'Röd', 'brown': 'Brun'
  };

  const colorNamesUk: Record<string, string> = {
    'white': 'Білий', 'black': 'Чорний', 'blue': 'Синій', 'gray': 'Сірий',
    'yellow': 'Жовтий', 'green': 'Зелений', 'red': 'Червоний', 'brown': 'Коричневий'
  };

  const lines = cardDataCsv.trim().split('\n').slice(1);
  const deck: Card[] = lines.map(line => {
    const parts = line.split(',');
    const id = parts[0];
    const uk = parts[1];
    const en = parts[2];
    const sv = parts[3];
    const catUk = parts[4];
    const colUk = parts[5];
    const img = parts[6];

    const category = categoryMap[catUk] || 'furniture';
    const color = colorMap[colUk] || 'white';

    return {
      id: `card_${id}`,
      category,
      color,
      itemEn: en,
      itemSv: sv,
      itemUk: uk,
      colorEn: colorNamesEn[color],
      colorSv: colorNamesSv[color],
      colorUk: colorNamesUk[color],
      imageUrl: img || null
    };
  });
  
  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
}

type Player = {
  id: string;
  socketId: string;
  name: string;
  tokenColor: string;
  age: number;
  position: number;
  skipNextTurn: boolean;
  place: number | null;
  connected: boolean;
  lastActive: number;
  missedTurns: number;
  isBot: boolean;
};

type GameState = {
  roomId: string;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  initiator: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentTurnIndex: number;
  phase: 'select' | 'reveal' | 'action';
  currentSelection: { category: string, color: string } | null;
  currentCard: Card | null;
  expectedMoves: number;
  turnStartTime: number;
  placesAssigned: number;
};

const games: Record<string, GameState> = {};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', ({ name, tokenColor, age, playerId }, callback) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const pId = playerId || uuidv4();
      
      games[roomId] = {
        roomId,
        status: 'lobby',
        initiator: pId,
        players: [{
          id: pId,
          socketId: socket.id,
          name,
          tokenColor,
          age,
          position: 0,
          skipNextTurn: false,
          place: null,
          connected: true,
          lastActive: Date.now(),
          missedTurns: 0,
          isBot: false
        }],
        deck: generateDeck(),
        discardPile: [],
        currentTurnIndex: 0,
        phase: 'select',
        currentSelection: null,
        currentCard: null,
        expectedMoves: 0,
        turnStartTime: 0,
        placesAssigned: 0
      };
      
      socket.join(roomId);
      callback({ success: true, roomId, playerId: pId });
      io.to(roomId).emit('game_update', getPublicGameState(games[roomId]));
    });

    socket.on('join_room', ({ roomId, name, tokenColor, age, playerId }, callback) => {
      const game = games[roomId];
      if (!game) return callback({ success: false, error: 'Game not found' });
      if (game.status !== 'lobby' && game.status !== 'paused') {
        // Check if reconnecting
        const existingPlayer = game.players.find(p => p.id === playerId);
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          existingPlayer.connected = true;
          existingPlayer.lastActive = Date.now();
          socket.join(roomId);
          callback({ success: true, playerId });
          io.to(roomId).emit('game_update', getPublicGameState(game));
          return;
        }
        return callback({ success: false, error: 'Game already started' });
      }
      
      if (game.players.length >= 6) return callback({ success: false, error: 'Room full' });
      if (game.players.some(p => p.tokenColor === tokenColor)) return callback({ success: false, error: 'Color taken' });
      if (game.players.some(p => p.name === name)) return callback({ success: false, error: 'Name taken' });

      const pId = playerId || uuidv4();
      game.players.push({
        id: pId,
        socketId: socket.id,
        name,
        tokenColor,
        age,
        position: 0,
        skipNextTurn: false,
        place: null,
        connected: true,
        lastActive: Date.now(),
        missedTurns: 0,
        isBot: false
      });
      
      socket.join(roomId);
      callback({ success: true, playerId: pId });
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('add_bot', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      if (game.initiator !== playerId) return;
      if (game.players.length >= 6) return;

      const botColors = colors.filter(c => !game.players.some(p => p.tokenColor === c));
      if (botColors.length === 0) return;

      const botColor = botColors[0];
      const botNames = ['Бот Альфа', 'Бот Бета', 'Бот Гамма', 'Бот Дельта', 'Бот Епсілон'];
      const availableNames = botNames.filter(n => !game.players.some(p => p.name === n));
      const botName = availableNames.length > 0 ? availableNames[0] : 'Бот ' + Math.floor(Math.random() * 1000);

      game.players.push({
        id: `bot_${uuidv4()}`,
        socketId: `bot_${uuidv4()}`,
        name: botName,
        tokenColor: botColor,
        age: Math.floor(Math.random() * 50) + 10,
        position: 0,
        skipNextTurn: false,
        place: null,
        connected: true,
        lastActive: Date.now(),
        missedTurns: 0,
        isBot: true
      });

      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('start_game', ({ roomId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'lobby') return;
      
      // Sort players by age for first game
      game.players.sort((a, b) => a.age - b.age);
      
      game.status = 'playing';
      game.turnStartTime = Date.now();
      io.to(roomId).emit('game_update', getPublicGameState(game));
      
      // Check if first player is a bot
      if (game.players[game.currentTurnIndex].isBot) {
        scheduleBotAction(game);
      }
    });

    socket.on('select_attributes', ({ roomId, playerId, category, color }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'select') return;
      
      currentPlayer.lastActive = Date.now();
      game.currentSelection = { category, color };
      game.phase = 'reveal';
      game.turnStartTime = Date.now();
      
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('reveal_card', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'reveal') return;
      
      currentPlayer.lastActive = Date.now();
      
      if (game.deck.length === 0) {
        game.deck = game.discardPile.sort(() => Math.random() - 0.5);
        game.discardPile = [];
      }
      
      const card = game.deck.pop()!;
      game.currentCard = card;
      
      // Compare
      let matches = 0;
      if (game.currentSelection?.category === card.category) matches++;
      if (game.currentSelection?.color === card.color) matches++;
      
      game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
      game.phase = 'action';
      game.turnStartTime = Date.now();
      
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('perform_action', ({ roomId, playerId, action }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id !== playerId || game.phase !== 'action') return;
      
      currentPlayer.lastActive = Date.now();
      
      let moves = 0;
      let skipNext = false;
      
      if (game.expectedMoves === 2) {
        if (action === 'move2') moves = 2;
        else { moves = 2; skipNext = true; }
      } else if (game.expectedMoves === 1) {
        if (action === 'move1') moves = 1;
        else { moves = 1; skipNext = true; }
      } else {
        if (action === 'pass') moves = 0;
        else { moves = 0; skipNext = true; }
      }
      
      currentPlayer.position = Math.min(29, currentPlayer.position + moves);
      currentPlayer.skipNextTurn = skipNext;
      
      if (currentPlayer.position === 29 && currentPlayer.place === null) {
        game.placesAssigned++;
        currentPlayer.place = game.placesAssigned;
      }
      
      if (game.currentCard) {
        game.discardPile.push(game.currentCard);
      }
      
      nextTurn(game);
      io.to(roomId).emit('game_update', getPublicGameState(game));
    });

    socket.on('give_up', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const player = game.players.find(p => p.id === playerId);
      if (player && player.place === null) {
        game.placesAssigned++;
        player.place = game.placesAssigned;
        
        // If it was their turn, move to next
        if (game.players[game.currentTurnIndex].id === playerId) {
          nextTurn(game);
        }
        io.to(roomId).emit('game_update', getPublicGameState(game));
      }
    });

    socket.on('leave_room', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game) return;

      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        const player = game.players[playerIndex];
        
        if (game.status === 'playing' && player.place === null) {
          game.placesAssigned++;
          player.place = 99; // Left the game
          
          if (game.players[game.currentTurnIndex].id === playerId) {
            nextTurn(game);
          }
        } else if (game.status === 'lobby') {
          game.players.splice(playerIndex, 1);
          if (game.initiator === playerId && game.players.length > 0) {
            game.initiator = game.players[0].id;
          }
        }
        
        socket.leave(roomId);
        io.to(roomId).emit('game_update', getPublicGameState(game));
        
        // If no players left, delete game
        if (game.players.filter(p => !p.isBot).length === 0) {
          delete games[roomId];
        }
      }
    });

    socket.on('pause_game', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (game && game.initiator === playerId) {
        const wasPaused = game.status === 'paused';
        game.status = wasPaused ? 'playing' : 'paused';
        if (wasPaused) {
          game.turnStartTime = Date.now();
        }
        io.to(roomId).emit('game_update', getPublicGameState(game));
      }
    });

    socket.on('ring_bell', ({ roomId, targetPlayerId }) => {
      io.to(roomId).emit('play_bell', { targetPlayerId });
    });

    socket.on('player_activity', ({ roomId, playerId }) => {
      const game = games[roomId];
      if (!game || game.status !== 'playing') return;
      
      const currentPlayer = game.players[game.currentTurnIndex];
      if (currentPlayer.id === playerId) {
        game.turnStartTime = Date.now();
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Find player and mark disconnected
      for (const roomId in games) {
        const game = games[roomId];
        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
          player.connected = false;
          io.to(roomId).emit('game_update', getPublicGameState(game));
        }
      }
    });
  });

  function scheduleBotAction(game: GameState) {
    if (game.status !== 'playing') return;
    const currentPlayer = game.players[game.currentTurnIndex];
    if (!currentPlayer.isBot) return;

    // Add a random delay to simulate thinking
    const delay = Math.floor(Math.random() * 2000) + 1000;

    setTimeout(() => {
      // Check if game state is still valid for this bot
      if (game.status !== 'playing') return;
      const currentP = game.players[game.currentTurnIndex];
      if (currentP.id !== currentPlayer.id) return;

      if (game.phase === 'select') {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        currentP.lastActive = Date.now();
        game.currentSelection = { category: randomCategory, color: randomColor };
        game.phase = 'reveal';
        game.turnStartTime = Date.now();
        
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
        scheduleBotAction(game);
      } else if (game.phase === 'reveal') {
        if (game.deck.length === 0) {
          game.deck = game.discardPile.sort(() => Math.random() - 0.5);
          game.discardPile = [];
        }
        
        const card = game.deck.pop()!;
        game.currentCard = card;
        
        let matches = 0;
        if (game.currentSelection?.category === card.category) matches++;
        if (game.currentSelection?.color === card.color) matches++;
        
        game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
        game.phase = 'action';
        game.turnStartTime = Date.now();
        
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
        scheduleBotAction(game);
      } else if (game.phase === 'action') {
        // Bot always chooses the correct action
        let action: 'pass' | 'move1' | 'move2' = 'pass';
        if (game.expectedMoves === 2) action = 'move2';
        else if (game.expectedMoves === 1) action = 'move1';
        else action = 'pass';

        let moves = 0;
        let skipNext = false;
        
        if (game.expectedMoves === 2) {
          if (action === 'move2') moves = 2;
          else { moves = 2; skipNext = true; }
        } else if (game.expectedMoves === 1) {
          if (action === 'move1') moves = 1;
          else { moves = 1; skipNext = true; }
        } else {
          if (action === 'pass') moves = 0;
          else { moves = 0; skipNext = true; }
        }
        
        currentP.position = Math.min(29, currentP.position + moves);
        currentP.skipNextTurn = skipNext;
        
        if (currentP.position === 29 && currentP.place === null) {
          game.placesAssigned++;
          currentP.place = game.placesAssigned;
        }
        
        if (game.currentCard) {
          game.discardPile.push(game.currentCard);
        }
        
        nextTurn(game);
        io.to(game.roomId).emit('game_update', getPublicGameState(game));
      }
    }, delay);
  }

  function nextTurn(game: GameState) {
    game.phase = 'select';
    game.currentSelection = null;
    game.currentCard = null;
    game.expectedMoves = 0;
    
    let nextIndex = (game.currentTurnIndex + 1) % game.players.length;
    let loopCount = 0;
    
    // Check if all active players have skipNextTurn
    const activePlayers = game.players.filter(p => p.place === null);
    if (activePlayers.length > 0 && activePlayers.every(p => p.skipNextTurn)) {
      activePlayers.forEach(p => p.skipNextTurn = false);
    }
    
    while (loopCount < game.players.length) {
      const p = game.players[nextIndex];
      if (p.place !== null) {
        nextIndex = (nextIndex + 1) % game.players.length;
        loopCount++;
        continue;
      }
      if (p.skipNextTurn) {
        p.skipNextTurn = false;
        nextIndex = (nextIndex + 1) % game.players.length;
        loopCount++;
        continue;
      }
      break;
    }
    
    game.currentTurnIndex = nextIndex;
    game.turnStartTime = Date.now();
    
    // Check if game over
    if (game.players.filter(p => p.place === null).length <= 1) {
      game.status = 'finished';
      const lastPlayer = game.players.find(p => p.place === null);
      if (lastPlayer) {
        game.placesAssigned++;
        lastPlayer.place = game.placesAssigned;
      }
    } else {
      if (game.players[game.currentTurnIndex].isBot) {
        scheduleBotAction(game);
      }
    }
  }

  // Timer check interval
  setInterval(() => {
    const now = Date.now();
    for (const roomId in games) {
      const game = games[roomId];
      if (game.status === 'playing') {
        const currentPlayer = game.players[game.currentTurnIndex];
        if (now - game.turnStartTime > 20000) {
          // Auto skip turn
          currentPlayer.missedTurns++;
          if (currentPlayer.missedTurns >= 2) {
            // Kick player
            currentPlayer.place = 99; // Kicked
          } else {
            currentPlayer.skipNextTurn = true;
          }
          nextTurn(game);
          io.to(roomId).emit('game_update', getPublicGameState(game));
        }
      }
    }
  }, 5000);

  // Bot logic interval
  setInterval(() => {
    const now = Date.now();
    for (const roomId in games) {
      const game = games[roomId];
      if (game.status === 'playing') {
        const currentPlayer = game.players[game.currentTurnIndex];
        if (currentPlayer.isBot) {
          // Add a small delay so it doesn't happen instantly
          if (now - game.turnStartTime > 2000) {
            if (game.phase === 'select') {
              const category = categories[Math.floor(Math.random() * categories.length)];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              currentPlayer.lastActive = Date.now();
              game.currentSelection = { category, color };
              game.phase = 'reveal';
              game.turnStartTime = Date.now();
              
              io.to(roomId).emit('game_update', getPublicGameState(game));
            } else if (game.phase === 'reveal') {
              currentPlayer.lastActive = Date.now();
              
              if (game.deck.length === 0) {
                game.deck = game.discardPile.sort(() => Math.random() - 0.5);
                game.discardPile = [];
              }
              
              const card = game.deck.pop()!;
              game.currentCard = card;
              
              // Compare
              let matches = 0;
              if (game.currentSelection?.category === card.category) matches++;
              if (game.currentSelection?.color === card.color) matches++;
              
              game.expectedMoves = matches === 2 ? 2 : matches === 1 ? 1 : 0;
              game.phase = 'action';
              game.turnStartTime = Date.now();
              
              io.to(roomId).emit('game_update', getPublicGameState(game));
            } else if (game.phase === 'action') {
              currentPlayer.lastActive = Date.now();
              
              // Bot has a chance to make a mistake
              const makeMistake = Math.random() < 0.1; // 10% chance to make a mistake
              let action: 'pass' | 'move1' | 'move2' = 'pass';
              
              if (!makeMistake) {
                if (game.expectedMoves === 2) action = 'move2';
                else if (game.expectedMoves === 1) action = 'move1';
                else action = 'pass';
              } else {
                const actions: ('pass' | 'move1' | 'move2')[] = ['pass', 'move1', 'move2'];
                action = actions[Math.floor(Math.random() * actions.length)];
              }
              
              let moves = 0;
              let skipNext = false;
              
              if (game.expectedMoves === 2) {
                if (action === 'move2') moves = 2;
                else { moves = 2; skipNext = true; }
              } else if (game.expectedMoves === 1) {
                if (action === 'move1') moves = 1;
                else { moves = 1; skipNext = true; }
              } else {
                if (action === 'pass') moves = 0;
                else { moves = 0; skipNext = true; }
              }
              
              currentPlayer.position = Math.min(29, currentPlayer.position + moves);
              currentPlayer.skipNextTurn = skipNext;
              
              if (currentPlayer.position === 29 && currentPlayer.place === null) {
                game.placesAssigned++;
                currentPlayer.place = game.placesAssigned;
              }
              
              if (game.currentCard) {
                game.discardPile.push(game.currentCard);
              }
              
              nextTurn(game);
              io.to(roomId).emit('game_update', getPublicGameState(game));
            }
          }
        }
      }
    }
  }, 1000);

  function getPublicGameState(game: GameState) {
    // Hide deck details, only send count
    return {
      ...game,
      deckCount: game.deck.length,
      deck: undefined,
      discardPile: undefined,
      expectedMoves: undefined // Hide expected moves from client
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}

startServer();
