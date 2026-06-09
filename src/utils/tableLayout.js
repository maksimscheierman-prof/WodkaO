/**
 * Geometrie für Pokertisch — eine Quelle für Filz-Ellipse, Karten und Avatare.
 * Index 0 = oben, gleichmäßig im Uhrzeigersinn.
 */

const AVATAR_TOUCH_GAP = 4;
const CARD_EDGE_PAD = 30;

/** Platz für Zugstatus + Lobby-Code oben (Safe Area). */
export const TOP_HUD_HEIGHT = 80;
/** Zusätzliche Verschiebung des gesamten Spielbereichs nach unten. */
export const TABLE_SHIFT_Y = 50;

/** Filz-Ellipse — identisch zu GameBoard felt View. */
export function getTableEllipse(boardWidth, boardHeight) {
  const tableW = boardWidth * 0.84;
  const tableH = boardHeight * 0.8;
  const tableLeft = boardWidth * 0.08;
  const maxTop = Math.max(0, boardHeight - tableH);
  const tableTop = Math.min(
    Math.max(TOP_HUD_HEIGHT, boardHeight * 0.1 + TABLE_SHIFT_Y),
    maxTop
  );

  return {
    centerX: tableLeft + tableW / 2,
    centerY: tableTop + tableH / 2,
    radiusX: tableW / 2,
    radiusY: tableH / 2,
    left: tableLeft,
    top: tableTop,
    width: tableW,
    height: tableH,
    borderRadius: boardWidth * 0.42,
  };
}

/** Einheits-Normale nach außen am Ellipsenpunkt (parametrischer Winkel). */
export function getOutwardNormal(angle, radiusX, radiusY) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nx = cos / radiusX;
  const ny = sin / radiusY;
  const len = Math.hypot(nx, ny) || 1;
  return { x: nx / len, y: ny / len };
}

/** Punkt exakt auf dem Tischrand. */
export function getEdgePoint(centerX, centerY, radiusX, radiusY, angle) {
  return {
    x: centerX + radiusX * Math.cos(angle),
    y: centerY + radiusY * Math.sin(angle),
  };
}

/** Inset vom Ellipsenrand — Karten vollständig auf der Tischfläche. */
export function getCardInsets(cardWidth, cardHeight, seatWidth, radiusX, radiusY) {
  const insetX = Math.max(
    cardWidth / 2 + CARD_EDGE_PAD,
    seatWidth / 2 + CARD_EDGE_PAD,
    50
  );
  const insetY = Math.max(cardHeight / 2 + CARD_EDGE_PAD, 40);

  return {
    insetX: Math.min(insetX, radiusX * 0.62),
    insetY: Math.min(insetY, radiusY * 0.62),
  };
}

/**
 * Karten: parametrisch innerhalb der Ellipse (eigener Inset, nicht Edge-Point).
 * Avatar: am äußeren Rand per Normale — unverändert getrennt.
 */
export function getPlayerPositions(
  playerCount,
  boardWidth,
  boardHeight,
  avatarBlockHeight = 100,
  cardDimensions = null
) {
  if (!boardWidth || !boardHeight || playerCount <= 0) return [];

  const { centerX, centerY, radiusX, radiusY } = getTableEllipse(
    boardWidth,
    boardHeight
  );

  const cardW = cardDimensions?.cardWidth ?? 52;
  const cardH = cardDimensions?.cardHeight ?? 78;
  const seatW = cardDimensions?.seatWidth ?? 110;
  const { insetX, insetY } = getCardInsets(
    cardW,
    cardH,
    seatW,
    radiusX,
    radiusY
  );

  const avatarOffset = avatarBlockHeight / 2 + AVATAR_TOUCH_GAP;

  return Array.from({ length: playerCount }, (_, index) => {
    const angle =
      playerCount === 1
        ? Math.PI / 2
        : (2 * Math.PI * index) / playerCount - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const edge = getEdgePoint(centerX, centerY, radiusX, radiusY, angle);
    const normal = getOutwardNormal(angle, radiusX, radiusY);

    return {
      card: {
        x: centerX + (radiusX - insetX) * cos,
        y: centerY + (radiusY - insetY) * sin,
      },
      avatar: {
        x: edge.x + normal.x * avatarOffset,
        y: edge.y + normal.y * avatarOffset,
      },
      edge,
      angle,
    };
  });
}

/** @deprecated Nutze getPlayerPositions */
export function getSeatPositions(playerCount, width, height) {
  return getPlayerPositions(playerCount, width, height).map((p) => p.card);
}

export function orderPlayersWithMeAtBottom(players, myName) {
  if (!players?.length) return [];
  const myIdx = players.findIndex((p) => p.name === myName);
  if (myIdx < 0) return players;

  const targetIdx = Math.floor(players.length / 2);
  const rotateBy = (myIdx - targetIdx + players.length) % players.length;
  return [...players.slice(rotateBy), ...players.slice(0, rotateBy)];
}

export function getCardSize(screenWidth) {
  if (screenWidth < 380) return { width: 44, height: 66, seatWidth: 100 };
  if (screenWidth < 520) return { width: 52, height: 78, seatWidth: 110 };
  return { width: 60, height: 90, seatWidth: 120 };
}

export function getAvatarSize(screenWidth) {
  if (screenWidth < 380) return { height: 80, labelWidth: 108 };
  if (screenWidth < 520) return { height: 100, labelWidth: 120 };
  return { height: 110, labelWidth: 130 };
}

/** Gesamthöhe Avatar-Block (Silhouette + Name + optional „am Zug“). */
export function getAvatarBlockHeight(avatarHeight) {
  return avatarHeight + 36;
}
