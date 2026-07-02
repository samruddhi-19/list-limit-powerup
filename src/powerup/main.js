/* global TrelloPowerUp */
import { getLimits, getCardCount } from "../lib/limits.js";

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
      height: 200,
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

  "list-actions": function () {
    return [
      {
        text: "Set Card Limit",
        callback: function (t) {
          return t.list("id", "name").then(function (list) {
            return t.popup({
              title: "Set Limit for " + list.name,
              url: "./list-limit.html",
              height: 180,
              args: { listId: list.id },
            });
          });
        },
      },
    ];
  },

  "list-badges": async function (t) {
    try {
      const list = await t.list("id");
      const limits = await getLimits(t);
      const limit = limits[list.id];
      if (!limit) return [];

      const count = await getCardCount(t, list.id);
      const overLimit = count > limit;

      return [
        {
          text: `${count} / ${limit}`,
          color: overLimit ? "red" : "green",
          refresh: 5,
        },
      ];
    } catch (e) {
      return [];
    }
  },

  "card-moved": async function (t, opts) {
    try {
      const listId = opts.to.list.id;
      const limits = await getLimits(t);
      const limit = limits[listId];
      if (!limit) return;

      const count = await getCardCount(t, listId);
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
