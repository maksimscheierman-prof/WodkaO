/**
 * Tisch-Slot-System — alle Spielobjekte relativ zu tableRect, nicht Screen-Center.
 */

export const MIN_GAPS = {
  deckDiscard: 20,
  deckMonster: 12,
  monsterAvatar: 10,
  monsterButton: 8,
  stackLabel: 14,
  drawButtonH: 44,
  drawButtonMargin: 6,
};

const SLOT_ANCHORS = {
  topMonster: { x: 0.5, y: 0.24 },
  bottomMonster: { x: 0.5, y: 0.76 },
  leftMonster: { x: 0.16, y: 0.5 },
  rightMonster: { x: 0.84, y: 0.5 },
};

export function isLayoutDebugEnabled() {
  return (
    typeof process !== "undefined" &&
    process.env.EXPO_PUBLIC_LAYOUT_DEBUG === "1"
  );
}

export function getSeatRole(seatIndex, playerCount) {
  if (playerCount <= 1) return "bottom";
  if (playerCount === 2) return seatIndex === 0 ? "top" : "bottom";
  const bottomIdx = Math.floor(playerCount / 2);
  if (seatIndex === 0) return "top";
  if (seatIndex === bottomIdx) return "bottom";
  const sideIndex =
    seatIndex < bottomIdx ? seatIndex - 1 : seatIndex - bottomIdx - 1;
  return sideIndex % 2 === 0 ? "left" : "right";
}

export function makeSlot(centerX, centerY, width, height) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return {
    centerX,
    centerY,
    width: w,
    height: h,
    left: centerX - w / 2,
    top: centerY - h / 2,
    right: centerX + w / 2,
    bottom: centerY + h / 2,
  };
}

export function slotsOverlap(a, b, gap = 0) {
  if (!a || !b) return false;
  return !(
    a.right + gap <= b.left ||
    b.right + gap <= a.left ||
    a.bottom + gap <= b.top ||
    b.bottom + gap <= a.top
  );
}

function scaleDims(dims, scale) {
  const s = Math.max(0.72, Math.min(1, scale));
  return {
    cardWidth: Math.round(dims.cardWidth * s),
    cardHeight: Math.round(dims.cardHeight * s),
    seatWidth: Math.round(dims.seatWidth * s),
    stackW: Math.round(dims.stackW * s),
    stackH: Math.round(dims.stackH * s),
    avatarBlockHeight: Math.round(dims.avatarBlockHeight * s),
    avatarLabelWidth: Math.round(dims.avatarLabelWidth * s),
    gaps: {
      deckDiscard: Math.round(MIN_GAPS.deckDiscard * s),
      deckMonster: Math.round(MIN_GAPS.deckMonster * s),
      monsterAvatar: Math.round(MIN_GAPS.monsterAvatar * s),
      monsterButton: Math.round(MIN_GAPS.monsterButton * s),
    },
    contentScale: s,
  };
}

function monsterAnchor(role) {
  switch (role) {
    case "top":
      return SLOT_ANCHORS.topMonster;
    case "bottom":
      return SLOT_ANCHORS.bottomMonster;
    case "left":
      return SLOT_ANCHORS.leftMonster;
    case "right":
      return SLOT_ANCHORS.rightMonster;
    default:
      return SLOT_ANCHORS.bottomMonster;
  }
}

function avatarCenterForRole(role, tableRect, avatarBlockHeight, avatarLabelWidth, gap) {
  const cx = tableRect.centerX;
  const cy = tableRect.centerY;
  const t = tableRect.top;
  const b = tableRect.top + tableRect.height;
  const l = tableRect.left;
  const r = tableRect.left + tableRect.width;

  switch (role) {
    case "top":
      return { x: cx, y: t - avatarBlockHeight / 2 - gap };
    case "bottom":
      return { x: cx, y: b + avatarBlockHeight / 2 + gap };
    case "left":
      return { x: l - avatarLabelWidth / 2 - gap, y: cy };
    case "right":
      return { x: r + avatarLabelWidth / 2 + gap, y: cy };
    default:
      return { x: cx, y: b + avatarBlockHeight / 2 + gap };
  }
}

function buildSlots(tableRect, dims, playerCount) {
  const {
    cardHeight,
    seatWidth,
    stackW,
    stackH,
    avatarBlockHeight,
    avatarLabelWidth,
    gaps,
  } = dims;

  const monsterCardH = cardHeight + 6;
  const playerSlots = [];

  for (let i = 0; i < playerCount; i++) {
    const role = getSeatRole(i, playerCount);
    const anchor = monsterAnchor(role);
    const mx = tableRect.left + tableRect.width * anchor.x;
    const my = tableRect.top + tableRect.height * anchor.y;
    const av = avatarCenterForRole(
      role,
      tableRect,
      avatarBlockHeight,
      avatarLabelWidth,
      gaps.monsterAvatar
    );

    playerSlots.push({
      seatIndex: i,
      role,
      monster: makeSlot(mx, my, seatWidth, monsterCardH),
      avatar: makeSlot(av.x, av.y, avatarLabelWidth, avatarBlockHeight),
    });
  }

  const topMonster =
    playerSlots.find((p) => p.role === "top")?.monster ??
    makeSlot(tableRect.centerX, tableRect.top + 20, 1, 1);
  const bottomMonster =
    playerSlots.find((p) => p.role === "bottom")?.monster ??
    makeSlot(tableRect.centerX, tableRect.top + tableRect.height - 20, 1, 1);

  const topBound = topMonster.bottom + gaps.deckMonster;
  const bottomBound = bottomMonster.top - gaps.deckMonster;
  const midBandCenter = (topBound + bottomBound) / 2;

  const deckCenterX =
    tableRect.centerX - stackW - gaps.deckDiscard / 2;
  const discardCenterX =
    tableRect.centerX + gaps.deckDiscard / 2;

  const stackBlockH = stackH + MIN_GAPS.stackLabel;
  const centerDeck = makeSlot(deckCenterX, midBandCenter, stackW + 8, stackBlockH);
  const centerDiscard = makeSlot(
    discardCenterX,
    midBandCenter,
    stackW + 8,
    stackBlockH
  );

  const drawButtonY =
    centerDeck.bottom +
    MIN_GAPS.drawButtonMargin +
    MIN_GAPS.drawButtonH / 2;
  const drawButton = makeSlot(
    deckCenterX,
    drawButtonY,
    stackW + 12,
    MIN_GAPS.drawButtonH
  );

  const deckColumn = makeSlot(
    deckCenterX,
    (centerDeck.top + drawButton.bottom) / 2,
    stackW + 16,
    drawButton.bottom - centerDeck.top
  );

  const roundLabel = makeSlot(
    tableRect.centerX,
    centerDeck.top - 18,
    tableRect.width * 0.6,
    20
  );

  return {
    tableRect,
    topPlayerArea: playerSlots.find((p) => p.role === "top")?.avatar ?? null,
    bottomPlayerArea:
      playerSlots.find((p) => p.role === "bottom")?.avatar ?? null,
    topMonsterSlot: topMonster,
    bottomMonsterSlot: bottomMonster,
    centerDeckSlot: centerDeck,
    centerDiscardSlot: centerDiscard,
    drawButtonSlot: drawButton,
    deckColumnSlot: deckColumn,
    roundLabelSlot: roundLabel,
    playerSlots,
    midBandCenter,
  };
}

function collectCollisionPairs(slots, playerCount) {
  const pairs = [];
  const {
    centerDeckSlot,
    centerDiscardSlot,
    drawButtonSlot,
    deckColumnSlot,
    topMonsterSlot,
    bottomMonsterSlot,
    playerSlots,
  } = slots;

  pairs.push([centerDeckSlot, centerDiscardSlot]);
  pairs.push([deckColumnSlot, topMonsterSlot]);
  pairs.push([deckColumnSlot, bottomMonsterSlot]);
  pairs.push([drawButtonSlot, bottomMonsterSlot]);
  pairs.push([centerDeckSlot, topMonsterSlot]);
  pairs.push([centerDiscardSlot, topMonsterSlot]);
  pairs.push([centerDeckSlot, bottomMonsterSlot]);
  pairs.push([centerDiscardSlot, bottomMonsterSlot]);

  for (const ps of playerSlots) {
    if (ps.role === "left" || ps.role === "right") {
      pairs.push([ps.monster, deckColumnSlot]);
      pairs.push([ps.monster, centerDeckSlot]);
      pairs.push([ps.monster, centerDiscardSlot]);
    }
  }

  if (playerCount >= 2) {
    pairs.push([topMonsterSlot, bottomMonsterSlot]);
  }

  return pairs;
}

function hasAnyOverlap(slots, playerCount, minGap = 2) {
  const pairs = collectCollisionPairs(slots, playerCount);
  return pairs.some(([a, b]) => slotsOverlap(a, b, minGap));
}

/**
 * Berechnet Slot-Layout mit Kollisionsauflösung durch proportionale Verkleinerung.
 */
export function computeTableSlotLayout(tableEllipse, dims, playerCount) {
  const tableRect = {
    left: tableEllipse.left,
    top: tableEllipse.top,
    width: tableEllipse.width,
    height: tableEllipse.height,
    centerX: tableEllipse.centerX,
    centerY: tableEllipse.centerY,
  };

  const baseDims = {
    cardWidth: dims.cardWidth,
    cardHeight: dims.cardHeight,
    seatWidth: dims.seatWidth,
    stackW: dims.stackW,
    stackH: dims.stackH,
    avatarBlockHeight: dims.avatarBlockHeight,
    avatarLabelWidth: dims.avatarLabelWidth,
    gaps: { ...MIN_GAPS },
  };

  let scale = 1;
  let scaled = scaleDims(baseDims, scale);
  let slots = buildSlots(tableRect, scaled, playerCount);

  while (scale > 0.72 && hasAnyOverlap(slots, playerCount)) {
    scale -= 0.04;
    scaled = scaleDims(baseDims, scale);
    slots = buildSlots(tableRect, scaled, playerCount);
  }

  return {
    slots,
    contentScale: scaled.contentScale,
    scaledDims: scaled,
    hasOverlap: hasAnyOverlap(slots, playerCount),
  };
}

export function slotToPosition(slot) {
  if (!slot) return null;
  return { x: slot.centerX, y: slot.centerY };
}

export const DEBUG_SLOT_COLORS = {
  table: "rgba(80,180,80,0.2)",
  centerDeck: "rgba(80,120,255,0.35)",
  centerDiscard: "rgba(255,120,80,0.35)",
  drawButton: "rgba(255,220,80,0.4)",
  topMonster: "rgba(200,80,255,0.35)",
  bottomMonster: "rgba(200,80,255,0.35)",
  avatar: "rgba(80,220,255,0.3)",
  sideMonster: "rgba(180,80,200,0.3)",
  deckColumn: "rgba(255,255,80,0.15)",
};
