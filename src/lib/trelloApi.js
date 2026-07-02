// Trello Power-Ups have no capability to render a badge on a list header
// (only on cards). To surface "count / limit" at the list level, we write
// it into the list's own name via the REST API, using the member's stored
// auth token from the real Trello authorization flow.

const TRELLO_APP_KEY = ""; // same key as src/auth/AuthPopup.jsx

const COUNT_SUFFIX_RE = /\s*\(\d+\/\d+\)\s*$/;

export function stripCountSuffix(name) {
  return name.replace(COUNT_SUFFIX_RE, "");
}

export async function renameListWithCount(t, listId, count, limit) {
  const token = await t.get("member", "private", "token");
  if (!token) return; // not authorized yet, nothing we can write

  const list = await t.list("name");
  const baseName = stripCountSuffix(list.name);
  const newName = limit ? `${baseName} (${count}/${limit})` : baseName;

  if (newName === list.name) return; // already correct, skip the write

  await putListName(listId, token, newName);
}

export async function clearListNameSuffix(t, listId) {
  const token = await t.get("member", "private", "token");
  if (!token) return;

  const list = await t.list("name");
  const cleanName = stripCountSuffix(list.name);
  if (cleanName === list.name) return;

  await putListName(listId, token, cleanName);
}

function putListName(listId, token, name) {
  const url =
    `https://api.trello.com/1/lists/${listId}` +
    `?key=${TRELLO_APP_KEY}&token=${encodeURIComponent(token)}` +
    `&name=${encodeURIComponent(name)}`;
  return fetch(url, { method: "PUT" });
}