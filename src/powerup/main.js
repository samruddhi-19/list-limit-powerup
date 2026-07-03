/* global TrelloPowerUp */
import { getLimits, getCardCount } from "../lib/limits.js";
import { renameListWithCount } from "../lib/trelloApi.js";

// Trello doesn't give Power-Ups a hook to recolor its native list header,
// so we keep the "count / limit" + colour dot written into the list's own
// name in sync (see trelloApi.renameListWithCount). This refreshes both
// sides of a move whenever cards get dragged between lists.
async function syncListName(t, listId) {
  const limits = await getLimits(t);
  const limit = limits[listId];
  if (!limit) return;
  const count = await getCardCount(t, listId);
  await renameListWithCount(t, listId, count, limit);
}

const ICON = "https://cdn-icons-png.flaticon.com/512/1828/1828884.png";

TrelloPowerUp.initialize({
  "authorization-status": async function (t) {
    const authorized = await t.get("member", "private", "authorized");
    if (authorized === undefined) {
      await t.set("member", "private", "authorized", false);
      return { authorized: false };
    }
    return { authorized: authorized === true };
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize List Limit Power-Up",
      url: "./auth.html",
      height: 340,
    });
  },

  "show-settings": function (t) {
    return t.popup({
      title: "List Limit Settings",
      url: "./settings.html",
      height: 300,
    });
  },

  "board-buttons": function () {
    return [
      {
        icon: ICON,
        text: "List Limits",
        callback: function (t) {
          return t.popup({
            title: "List Limits",
            url: "./settings.html",
            height: 300,
          });
        },
      },
    ];
  },

  "list-actions": function (t) {
    return [
      {
        text: "Set Card Limit",
        callback: function (t) {
          const listId = t.getContext().list;
          return t.popup({
            title: "Set List Limit",
            url: "./list-limit.html",
            height: 340,
            args: { listId: listId },
          });
        },
      },
    ];
  },

  "card-moved": async function (t, opts) {
    try {
      const toListId = opts.to.list.id;
      const fromListId = opts.from?.list?.id;

      // Refresh the name badge on both ends of the move.
      await syncListName(t, toListId);
      if (fromListId && fromListId !== toListId) {
        await syncListName(t, fromListId);
      }

      const limits = await getLimits(t);
      const limit = limits[toListId];
      if (!limit) return;

      const count = await getCardCount(t, toListId);
      if (count > limit) {
        return t.alert({
          message: `"${opts.to.list.name}" is over its limit (${count}/${limit}).`,
          duration: 6,
          display: "warning",
        });
      }
    } catch (e) {
      // fail silently
    }
  },
});