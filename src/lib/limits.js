// Shared helpers used by every popup + the headless powerup capabilities.
// Limits are stored as one shared object on the board:
// { "<listId>": 5, "<listId2>": 3 }

import { clearListNameSuffix } from "./trelloApi.js";

export async function getLimits(t) {
  const limits = await t.get("board", "shared", "listLimits");
  return limits || {};
}

export async function getLimitForList(t, listId) {
  const limits = await getLimits(t);
  return limits[listId]; // undefined if no limit set
}

export async function setLimitForList(t, listId, limit) {
  const limits = await getLimits(t);
  if (limit === null || limit === undefined || limit === "") {
    delete limits[listId];
    await t.set("board", "shared", "listLimits", limits);
    await clearListNameSuffix(t, listId).catch(() => {});
    return limits;
  }
  limits[listId] = Number(limit);
  await t.set("board", "shared", "listLimits", limits);
  return limits;
}

export async function setAllLimits(t, limits) {
  return t.set("board", "shared", "listLimits", limits);
}

export async function getCardCount(t, listId) {
  // t.cards is only available from a board-scoped context (e.g. list-badges)
  const cards = await t.cards(listId);
  return cards.length;
}