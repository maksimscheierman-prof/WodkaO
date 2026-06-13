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

/** Sicherheitsabstand Monster ↔ Tischrand (px, vor Skalierung). */
export const MONSTER_EDGE_MARGIN = { min: 15, max: 25 };

const MIN_TABLE_HEIGHT_FOR_MARGIN = 160;

const SIDE_MONSTER_ANCHORS = {
  left: { x: 0.16, y: 0.5 },
  right: { x: 0.84, y: 0.5 },
};

/**
 * Responsiver Randabstand für Top/Bottom-Monster (15–25 px).
 * Skaliert mit Tischhöhe und optional contentScale bei Kollisionsauflösung.
 */
export function getMonsterEdgeMargin(tableHeight, scale = 1) {
  const h = Math.max(MIN_TABLE_HEIGHT_FOR_MARGIN, tableHeight);
  const t = (h - MIN_TABLE_HEIGHT_FOR_MARGIN) / (520 - MIN_TABLE_HEIGHT_FOR_MARGIN);
  const raw = MONSTER_EDGE_MARGIN.min + t * (MONSTER_EDGE_MARGIN.max - MONSTER_EDGE_MARGIN.min);
  const clamped = Math.round(
    Math.max(MONSTER_EDGE_MARGIN.min, Math.min(MONSTER_EDGE_MARGIN.max, raw))
  );
  return Math.max(12, Math.round(clamped * scale));
}

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

const MIN_CONTENT_SCALE = 0.55;

function scaleDims(dims, scale) {
  const s = Math.max(MIN_CONTENT_SCALE, Math.min(1, scale));
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
      drawButtonH: Math.round(MIN_GAPS.drawButtonH * s),
      drawButtonMargin: Math.round(MIN_GAPS.drawButtonMargin * s),
      stackLabel: Math.round(MIN_GAPS.stackLabel * s),
    },
    contentScale: s,
  };
}

function monsterCenterForRole(role, tableRect, monsterCardH, edgeMargin) {
  const cx = tableRect.centerX;
  const t = tableRect.top;
  const b = t + tableRect.height;

  switch (role) {
    case "top":
      return { x: cx, y: t + edgeMargin + monsterCardH / 2 };
    case "bottom":
      return { x: cx, y: b - edgeMargin - monsterCardH / 2 };
    case "left":
      return {
        x: tableRect.left + tableRect.width * SIDE_MONSTER_ANCHORS.left.x,
        y: t + tableRect.height * SIDE_MONSTER_ANCHORS.left.y,
      };
    case "right":
      return {
        x: tableRect.left + tableRect.width * SIDE_MONSTER_ANCHORS.right.x,
        y: t + tableRect.height * SIDE_MONSTER_ANCHORS.right.y,
      };
    default:
      return { x: cx, y: b - edgeMargin - monsterCardH / 2 };
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
  const edgeMargin = getMonsterEdgeMargin(
    tableRect.height,
    dims.contentScale ?? 1
  );
  const playerSlots = [];

  for (let i = 0; i < playerCount; i++) {
    const role = getSeatRole(i, playerCount);
    const pos = monsterCenterForRole(role, tableRect, monsterCardH, edgeMargin);
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
      monster: makeSlot(pos.x, pos.y, seatWidth, monsterCardH),
      avatar: makeSlot(av.x, av.y, avatarLabelWidth, avatarBlockHeight),
    });
  }

  const topMonster =
    playerSlots.find((p) => p.role === "top")?.monster ??
    makeSlot(
      tableRect.centerX,
      tableRect.top + edgeMargin + monsterCardH / 2,
      seatWidth,
      monsterCardH
    );
  const bottomMonster =
    playerSlots.find((p) => p.role === "bottom")?.monster ??
    makeSlot(
      tableRect.centerX,
      tableRect.top + tableRect.height - edgeMargin - monsterCardH / 2,
      seatWidth,
      monsterCardH
    );

  const topBound = topMonster.bottom + gaps.deckMonster;
  const bottomBound = bottomMonster.top - gaps.deckMonster;
  const midBandCenter = (topBound + bottomBound) / 2;

  const deckCenterX =
    tableRect.centerX - stackW - gaps.deckDiscard / 2;
  const discardCenterX =
    tableRect.centerX + gaps.deckDiscard / 2;

  const stackBlockH = stackH + gaps.stackLabel;
  const centerDeck = makeSlot(deckCenterX, midBandCenter, stackW + 8, stackBlockH);
  const centerDiscard = makeSlot(
    discardCenterX,
    midBandCenter,
    stackW + 8,
    stackBlockH
  );

  const deckColumn = makeSlot(
    deckCenterX,
    midBandCenter,
    stackW + 16,
    stackBlockH
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
    deckColumnSlot: deckColumn,
    roundLabelSlot: roundLabel,
    playerSlots,
    midBandCenter,
    monsterEdgeMargin: edgeMargin,
  };
}

function collectCollisionPairs(slots, playerCount) {
  const pairs = [];
  const {
    centerDeckSlot,
    centerDiscardSlot,
    deckColumnSlot,
    topMonsterSlot,
    bottomMonsterSlot,
    playerSlots,
  } = slots;

  pairs.push([centerDeckSlot, centerDiscardSlot]);
  pairs.push([deckColumnSlot, topMonsterSlot]);
  pairs.push([deckColumnSlot, bottomMonsterSlot]);
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

function midBandFits(slots, dims) {
  const gap = dims.gaps?.deckMonster ?? MIN_GAPS.deckMonster;
  const band =
    slots.bottomMonsterSlot.top - slots.topMonsterSlot.bottom - gap * 2;
  const need =
    dims.stackH + (dims.gaps?.stackLabel ?? MIN_GAPS.stackLabel);
  return band >= need;
}

function hasAnyOverlap(slots, playerCount, minGap = 2) {
  const pairs = collectCollisionPairs(slots, playerCount);
  return pairs.some(([a, b]) => slotsOverlap(a, b, minGap));
}

function layoutIsValid(slots, playerCount, dims) {
  return !hasAnyOverlap(slots, playerCount) && midBandFits(slots, dims);
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

  while (scale > MIN_CONTENT_SCALE && !layoutIsValid(slots, playerCount, scaled)) {
    scale -= 0.04;
    scaled = scaleDims(baseDims, scale);
    slots = buildSlots(tableRect, scaled, playerCount);
  }

  return {
    slots,
    contentScale: scaled.contentScale,
    scaledDims: scaled,
    hasOverlap: !layoutIsValid(slots, playerCount, scaled),
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
