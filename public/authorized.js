(function () {
  // Trello redirects here as #token=XXXX after the member approves.
  var params = new URLSearchParams(window.location.hash.substring(1));
  var token = params.get("token");
  var el = document.getElementById("status");

  if (!token) {
    if (el) el.textContent = "Something went wrong — no token received. You can close this window.";
    return;
  }

  if (window.opener) {
    window.opener.postMessage(
      { source: "list-limiter-auth", token: token },
      "*"
    );
  }

  if (el) el.textContent = "Connected! Closing this window…";

  window.close();

  // If window.close() was blocked (some browsers refuse it), let the user
  // know it's safe to close manually instead of leaving them staring at
  // a message that never changes.
  setTimeout(function () {
    if (el) el.textContent = "Connected! You can close this window now.";
  }, 400);
})();