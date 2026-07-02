// Shared helpers used by every popup + the headless powerup capabilities.
// Limits are stored as one shared object on the board:
// { "<listId>": 5, "<listId2>": 3 }

export async function getLimits(t) {
  const limits = await t.get("board", "shared", "listLimits");
  return limits || {};
}

export async function setLimitForList(t, listId, limit) {
  const limits = await getLimits(t);
  if (limit === null || limit === undefined || limit === "") {
    delete limits[listId];
  } else {
    limits[listId] = Number(limit);
  }
  return t.set("board", "shared", "listLimits", limits);
}

export async function setAllLimits(t, limits) {
  return t.set("board", "shared", "listLimits", limits);
}

export async function getCardCount(t, listId) {
  // t.cards is only available from a board-scoped context (e.g. list-badges)
  const cards = await t.cards(listId);
  return cards.length;
}
