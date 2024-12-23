import { validate } from "./utils/validate.js";
import { render } from "./utils/render.js";
import { getState, updateSTATE } from "./state.js";

var socket = null;
const App = document.getElementById("app");

// disconect socket
function cleanUpSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("socket disconnected");
  }
}

// ROUTER
// Initialize frontend router
let Router = new Navigo("/", { hash: true });

document.addEventListener("DOMContentLoaded", () => {
  let routes = {
    "/": () => {
      import("./landingView.js").then(({ landingView }) => {
        render(
          App,
          landingView,
          () => updateSTATE({ ...getState(), currentView: "landingview" }),
          `resolving landing view`
        );
      });
      cleanUpSocket();
    },
    "/gamemode": () => {
      import("./gamemodeView.js").then(({ chooseGameMode }) => {
        render(
          App,
          chooseGameMode,
          () => updateSTATE({ ...getState(), currentView: "choosegamemode" }),
          "resolving game mode view"
        );
      });
      cleanUpSocket();
    },
    "/play/:mode": async (params) => {
      let { gamingView } = await import("./gameView.js");
      let { init } = await import("./board.js");

      if (params.data.mode == "ai") {
        import("./gameView.js").then(({ gamingView }) => {
          render(
            App,
            () => gamingView("ai"),
            // initializes game for ai(offline) mode
            () => init("ai"),
            "initializing ai"
          );
        });
      } else if (params.data.mode == "multiplayer") {
        // might check to see if user is online to proceed on finding a match
        socket = io();
        const currentState = getState();

        socket.emit("find-a-match", {
          avatar: currentState?.avatar,
          gametag: currentState?.gametag,
          userID: currentState?.userID,
        });

        socket.on("game-found", (data) => {
          render(
            App,
            () => gamingView("multiplayer", socket, data.players),
            // initializes game for multiplayer(online) mode
            () => init("multiplayer", socket, data.first, data.players),
            data.loadingMessage,
            data.found
          );
        });
      }
    },
  };

  Router.on({
    ...routes,
  }).resolve();

  document.addEventListener("click", (e) => {
    let target = e.target;
    if (target.hasAttribute("data-navigate")) {
      e.preventDefault();
      const path = target.getAttribute("data-navigate");
      const state = getState();

      let result = validate(state);

      if (!result.valid || state.error) {
        if (result.message) state.error = result.message;
        import("./error.js").then(({ error }) => {
          App.appendChild(error(state.error));
        });
        return;
      }

      Router.navigate(path);
    }
  });
});
