/* global TrelloPowerUp */
import { getLimits, getCardCount } from "../lib/limits.js";
import { renameListWithCount } from "../lib/trelloApi.js";

const ICON = "https://cdn-icons-png.flaticon.com/512/1828/1828884.png";

TrelloPowerUp.initialize({
  "authorization-status": async function (t) {
    const token = await t.get("member", "private", "token");
    return { authorized: !!token };
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Connect Trello Account",
      url: "./auth.html",
      height: 160,
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

  "card-badges": async function (t) {
    try {
      const card = await t.card("id", "idList");
      const limits = await getLimits(t);
      const limit = limits[card.idList];
      if (!limit) return [];

      const cards = await t.cards(card.idList);
      const count = cards.length;
      const isLastCard = cards.length > 0 && cards[cards.length - 1].id === card.id;

      // Piggyback the list-header rename off this real capability call,
      // since Trello has no capability that fires on card add/move directly.
      if (isLastCard) {
        renameListWithCount(t, card.idList, count, limit).catch(() => {});
      }

      if (!isLastCard) return [];

      return [
        {
          text: `${count} / ${limit}`,
          color: count > limit ? "red" : "green",
        },
      ];
    } catch (e) {
      return [];
    }
  },
});