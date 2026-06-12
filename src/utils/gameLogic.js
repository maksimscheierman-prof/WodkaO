import { fetchAllCards } from "./cards";

let cachedCards = null;

export async function loadCards() {
  if (!cachedCards) {
    cachedCards = await fetchAllCards();
  }
  return cachedCards;
}

/** Fisher-Yates shuffle — gibt neues Array zurück. */
export function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export async function buildMonsterDeck() {
  const cards = await loadCards();
  return shuffleDeck(cards.filter((c) => c.type === "MONSTER"));
}

export async function buildSaufstapel() {
  const cards = await loadCards();
  return shuffleDeck(
    cards.filter((c) => c.type === "MAGIC" || c.type === "TRAP")
  );
}

export async function buildGameDecks() {
  const [monsterDeck, saufDeck] = await Promise.all([
    buildMonsterDeck(),
    buildSaufstapel(),
  ]);
  return { monsterDeck, saufDeck };
}

export function drawTopCard(deck) {
  const pile = [...(deck || [])];
  if (pile.length === 0) return { card: null, deck: pile };
  const card = pile.pop();
  return { card, deck: pile };
}

// Legacy — weiterhin für Tests/Fallback
export async function randomCardByType(type) {
  const cards = await loadCards();
  const filtered = cards.filter((c) => c.type === type.toUpperCase());
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export async function randomMagic() {
  return randomCardByType("MAGIC");
}

export async function randomMonster() {
  return randomCardByType("MONSTER");
}

export async function randomTrap() {
  return randomCardByType("TRAP");
}
