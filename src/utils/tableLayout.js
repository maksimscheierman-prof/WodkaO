/**
 * Zentrale Board-Layout-Berechnung — eine Quelle für alle Maße (LayoutBuilder/onLayout).
 */

import { computeTableSlotLayout } from "./tableSlotLayout";

const AVATAR_TOUCH_GAP = 4;

export const MIN_BOARD_HEIGHT = 300;
export const MIN_TABLE_HEIGHT = 160;
export const MIN_TABLE_WIDTH = 220;
/** Mindestverhältnis Tischhöhe / Tischbreite (verhindert „Platte“-Ellipse). */
export const MIN_TABLE_ASPECT = 0.36;

export function getLayoutMetrics(boardWidth, boardHeight = 800) {
  const veryShort = boardHeight < 520;
  const short = boardHeight < 680;
  const landscape = isTrueLandscape(boardWidth, boardHeight);
  return {
    topHudHeight: veryShort ? 40 : landscape ? 48 : short ? 64 : 80,
    tableShiftY: 0,
  };
}

export function isSquashedViewport(boardWidth, boardHeight) {
  if (!boardWidth || !boardHeight) return false;
  const aspect = boardWidth / boardHeight;
  return boardHeight < 380 || aspect > 1.65;
}

export function isTrueLandscape(boardWidth, boardHeight) {
  if (!boardWidth || !boardHeight) return false;
  if (isSquashedViewport(boardWidth, boardHeight)) return false;
  return boardWidth > boardHeight && boardHeight >= 420;
}

export function getTableInnerPadding(cardHeight, radiusY, radiusX) {
  const r = Math.min(radiusY, radiusX);
  return Math.max(10, Math.min(24, Math.round(cardHeight * 0.14 + r * 0.06)));
}

export function getCardSlotHalfExtents(cardWidth, cardHeight, seatWidth) {
  const rowPad = 3;
  const halfH = cardHeight / 2 + rowPad;
  const rowW = cardWidth * 2 + 10;
  const halfW = Math.min(seatWidth / 2, rowW / 2);
  return { halfW, halfH, rowPad };
}

export const TOP_HUD_HEIGHT = 80;

export function getAvatarMargins(avatarBlockHeight, avatarLabelWidth = 120) {
  const avatarOffset = avatarBlockHeight / 2 + AVATAR_TOUCH_GAP;
  const verticalExtent = avatarOffset + avatarBlockHeight / 2 + 10;
  const sideExtent = Math.max(
    avatarBlockHeight * 0.55,
    avatarLabelWidth / 2 + 12
  );
  return { verticalExtent, sideExtent, avatarOffset };
}

export function getTableScaleFactors(boardWidth, boardHeight) {
  const squashed = isSquashedViewport(boardWidth, boardHeight);
  const landscape = isTrueLandscape(boardWidth, boardHeight);
  const veryShort = boardHeight < 520;
  const short = boardHeight < 680;

  if (squashed) {
    return { width: 0.9, height: 0.76, squashed: true, landscape: false };
  }
  if (veryShort) {
    return {
      width: 0.76,
      height: landscape ? 0.68 : 0.72,
      squashed: false,
      landscape,
    };
  }
  if (short || landscape) {
    return {
      width: 0.84,
      height: landscape ? 0.76 : 0.8,
      squashed: false,
      landscape,
    };
  }
  return { width: 0.88, height: 0.86, squashed: false, landscape: false };
}

export function getMinTableHeight(avatarBlockHeight, stackHeight = 88, cardHeight = 100) {
  const edgeMargin = 20;
  const monsterCardH = cardHeight + 6;
  const centerBand =
    stackHeight + 14 + MIN_GAPS_SLOT_DECK_MONSTER * 2;
  const edgeMonsterNeed = 2 * edgeMargin + 2 * monsterCardH + centerBand;
  return Math.max(MIN_TABLE_HEIGHT, Math.round(edgeMonsterNeed));
}

const MIN_GAPS_SLOT_DECK_MONSTER = 12;

export function getTableEllipse(
  boardWidth,
  boardHeight,
  layoutMetrics = null,
  avatarBlockHeight = 100,
  avatarLabelWidth = 120,
  stackHeight = 88
) {
  if (!boardWidth || !boardHeight) {
    return {
      centerX: 0,
      centerY: 0,
      radiusX: 0,
      radiusY: 0,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      borderRadius: 0,
    };
  }

  const effectiveHeight = Math.max(boardHeight, MIN_BOARD_HEIGHT);
  const { verticalExtent, sideExtent } = getAvatarMargins(
    avatarBlockHeight,
    avatarLabelWidth
  );
  const scale = getTableScaleFactors(boardWidth, effectiveHeight);

  const topReserve = verticalExtent;
  const bottomReserve = verticalExtent + 8;

  const safeW = Math.max(MIN_TABLE_WIDTH, boardWidth - sideExtent * 2);
  const safeH = Math.max(
    getMinTableHeight(avatarBlockHeight, stackHeight),
    effectiveHeight - topReserve - bottomReserve
  );

  let tableW = safeW * scale.width;
  let tableH = safeH * scale.height;

  const minH = getMinTableHeight(avatarBlockHeight, stackHeight);
  tableH = Math.max(minH, tableH);
  tableW = Math.max(MIN_TABLE_WIDTH, tableW);

  if (tableH / tableW < MIN_TABLE_ASPECT) {
    tableH = tableW * MIN_TABLE_ASPECT;
  }

  const tableLeft = (boardWidth - tableW) / 2;
  const tableTop = topReserve + Math.max(0, (safeH - tableH) * 0.12);

  return {
    centerX: tableLeft + tableW / 2,
    centerY: tableTop + tableH / 2,
    radiusX: tableW / 2,
    radiusY: tableH / 2,
    left: tableLeft,
    top: tableTop,
    width: tableW,
    height: tableH,
    borderRadius: tableW * 0.42,
    scale,
    effectiveHeight,
  };
}

export function getOutwardNormal(angle, radiusX, radiusY) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const nx = cos / radiusX;
  const ny = sin / radiusY;
  const len = Math.hypot(nx, ny) || 1;
  return { x: nx / len, y: ny / len };
}

export function getEdgePoint(centerX, centerY, radiusX, radiusY, angle) {
  return {
    x: centerX + radiusX * Math.cos(angle),
    y: centerY + radiusY * Math.sin(angle),
  };
}

export function getInnerTableRadii(
  radiusX,
  radiusY,
  cardWidth,
  cardHeight,
  seatWidth
) {
  const { halfW, halfH } = getCardSlotHalfExtents(
    cardWidth,
    cardHeight,
    seatWidth
  );
  const pad = getTableInnerPadding(cardHeight, radiusY, radiusX);

  return {
    radiusX: Math.max(radiusX * 0.2, radiusX - halfW - pad),
    radiusY: Math.max(radiusY * 0.2, radiusY - halfH - pad),
    tableInnerPadding: pad,
    halfW,
    halfH,
  };
}

export function getPlayerPositions(
  playerCount,
  boardWidth,
  boardHeight,
  avatarBlockHeight = 100,
  cardDimensions = null,
  layoutMetrics = null,
  avatarLabelWidth = 120,
  stackHeight = 88
) {
  if (!boardWidth || !boardHeight || playerCount <= 0) return [];

  const { centerX, centerY, radiusX, radiusY } = getTableEllipse(
    boardWidth,
    boardHeight,
    layoutMetrics,
    avatarBlockHeight,
    avatarLabelWidth,
    stackHeight
  );

  const cardW = cardDimensions?.cardWidth ?? 52;
  const cardH = cardDimensions?.cardHeight ?? 78;
  const seatW = cardDimensions?.seatWidth ?? 110;

  const { radiusX: innerRx, radiusY: innerRy, halfH, halfW, tableInnerPadding } =
    getInnerTableRadii(radiusX, radiusY, cardW, cardH, seatW);

  const { avatarOffset } = getAvatarMargins(avatarBlockHeight, avatarLabelWidth);

  const tableBottom = centerY + radiusY;
  const tableTop = centerY - radiusY;

  return Array.from({ length: playerCount }, (_, index) => {
    const angle =
      playerCount === 1
        ? Math.PI / 2
        : (2 * Math.PI * index) / playerCount - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const edge = getEdgePoint(centerX, centerY, radiusX, radiusY, angle);
    const normal = getOutwardNormal(angle, radiusX, radiusY);

    let cardX = centerX + innerRx * cos;
    let cardY = centerY + innerRy * sin;

    const minY = tableTop + tableInnerPadding + halfH;
    const maxY = tableBottom - tableInnerPadding - halfH;
    cardY = Math.min(maxY, Math.max(minY, cardY));

    const tableLeft = centerX - radiusX;
    const tableRight = centerX + radiusX;
    const minX = tableLeft + tableInnerPadding + halfW;
    const maxX = tableRight - tableInnerPadding - halfW;
    cardX = Math.min(maxX, Math.max(minX, cardX));

    return {
      card: { x: cardX, y: cardY },
      avatar: {
        x: edge.x + normal.x * avatarOffset,
        y: edge.y + normal.y * avatarOffset,
      },
      edge,
      angle,
    };
  });
}

export function orderPlayersWithMeAtBottom(players, myName) {
  if (!players?.length) return [];
  const myIdx = players.findIndex((p) => p.name === myName);
  if (myIdx < 0) return players;

  const targetIdx = Math.floor(players.length / 2);
  const rotateBy = (myIdx - targetIdx + players.length) % players.length;
  return [...players.slice(rotateBy), ...players.slice(0, rotateBy)];
}

export function getCardSize(boardWidth, boardHeight = 800) {
  const squashed = isSquashedViewport(boardWidth, boardHeight);
  const landscape = isTrueLandscape(boardWidth, boardHeight);
  const veryShort = boardHeight < 520;
  const short = boardHeight < 680;

  if (squashed) {
    return { width: 42, height: 63, seatWidth: 96 };
  }
  if (veryShort || (landscape && boardHeight < 560)) {
    return { width: 38, height: 57, seatWidth: 88 };
  }
  if (boardWidth < 360 || (short && boardWidth < 400)) {
    return { width: 40, height: 60, seatWidth: 92 };
  }
  if (boardWidth < 380 || short) {
    return { width: 44, height: 66, seatWidth: 100 };
  }
  if (boardWidth < 520 || landscape) {
    return { width: 52, height: 78, seatWidth: 110 };
  }
  return { width: 60, height: 90, seatWidth: 120 };
}

export function getAvatarSize(boardWidth, boardHeight = 800) {
  const squashed = isSquashedViewport(boardWidth, boardHeight);
  const landscape = isTrueLandscape(boardWidth, boardHeight);
  const veryShort = boardHeight < 520;
  const short = boardHeight < 680;

  if (squashed) {
    return { height: 68, labelWidth: 100 };
  }
  if (veryShort || (landscape && boardHeight < 560)) {
    return { height: 64, labelWidth: 92 };
  }
  if (boardWidth < 360 || (short && boardWidth < 400)) {
    return { height: 72, labelWidth: 96 };
  }
  if (boardWidth < 380 || short) {
    return { height: 80, labelWidth: 108 };
  }
  if (boardWidth < 520 || landscape) {
    return { height: 100, labelWidth: 120 };
  }
  return { height: 110, labelWidth: 130 };
}

export function getAvatarBlockHeight(avatarHeight) {
  return avatarHeight + 44;
}

export function getBoardTopInset(boardHeight, safeAreaTop = 0) {
  const compact = boardHeight < 680;
  return Math.round(safeAreaTop + (compact ? 40 : 46));
}

/**
 * Einzige Layout-Quelle für GameBoard — alles aus boardWidth/boardHeight (onLayout).
 */
export function computeBoardLayout(boardWidth, boardHeight, playerCount = 2) {
  const layoutMetrics = getLayoutMetrics(boardWidth, boardHeight);
  let { width: cardWidth, height: cardHeight, seatWidth } = getCardSize(
    boardWidth,
    boardHeight
  );
  let { height: avatarHeight, labelWidth: avatarLabelWidth } = getAvatarSize(
    boardWidth,
    boardHeight
  );
  let avatarBlockHeight = getAvatarBlockHeight(avatarHeight);
  let stackH = Math.round(cardHeight * 1.15);
  let stackW = Math.round(cardWidth * 1.15);
  const tableEllipse = getTableEllipse(
    boardWidth,
    boardHeight,
    layoutMetrics,
    avatarBlockHeight,
    avatarLabelWidth,
    stackH
  );
  const scale = getTableScaleFactors(boardWidth, boardHeight);

  const slotLayout = computeTableSlotLayout(
    tableEllipse,
    {
      cardWidth,
      cardHeight,
      seatWidth,
      stackW,
      stackH,
      avatarBlockHeight,
      avatarLabelWidth,
    },
    Math.max(1, playerCount)
  );

  const sd = slotLayout.scaledDims;
  cardWidth = sd.cardWidth;
  cardHeight = sd.cardHeight;
  seatWidth = sd.seatWidth;
  stackH = sd.stackH;
  stackW = sd.stackW;
  avatarBlockHeight = sd.avatarBlockHeight;
  avatarLabelWidth = sd.avatarLabelWidth;

  return {
    boardWidth,
    boardHeight,
    layoutMetrics,
    cardWidth,
    cardHeight,
    seatWidth,
    avatarHeight: Math.round(avatarHeight * slotLayout.contentScale),
    avatarLabelWidth,
    avatarBlockHeight,
    stackH,
    stackW,
    tableEllipse,
    slotLayout,
    squashed: isSquashedViewport(boardWidth, boardHeight),
    landscape: isTrueLandscape(boardWidth, boardHeight),
    scale,
    minBoardHeight: MIN_BOARD_HEIGHT,
    contentScale: slotLayout.contentScale,
  };
}

export function logLayoutDebug(source, payload) {
  const enabled =
    typeof process !== "undefined" &&
    process.env.EXPO_PUBLIC_LAYOUT_DEBUG === "1";
  if (enabled) {
    console.log(`[LayoutDebug:${source}]`, payload);
  }
}

/** @deprecated */
export const TABLE_SHIFT_Y = 50;

export function getSeatPositions(playerCount, width, height) {
  return getPlayerPositions(playerCount, width, height).map((p) => p.card);
}

export function getCardInsets(cardWidth, cardHeight, seatWidth, radiusX, radiusY) {
  const inner = getInnerTableRadii(
    radiusX,
    radiusY,
    cardWidth,
    cardHeight,
    seatWidth
  );
  return {
    insetX: radiusX - inner.radiusX,
    insetY: radiusY - inner.radiusY,
  };
}
