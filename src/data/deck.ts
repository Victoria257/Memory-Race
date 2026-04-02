import { cardDataCsv } from './cardData.js';
import { Card } from '../types.js';

export const CATEGORIES = ['furniture', 'appliances', 'transport', 'animals', 'food', 'clothing', 'dishes'];
export const COLORS = ['gray', 'black', 'blue', 'yellow', 'green', 'red', 'brown', 'white'];

export function generateDeck(): Card[] {
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
  
  // Shuffle using Fisher-Yates algorithm for better randomness
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}
