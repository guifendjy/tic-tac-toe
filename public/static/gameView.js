import { Board } from "./board.js";
import { Chat } from "./chat.js";
import { getState, updateSTATE } from "./state.js";

import { PlayerInfoComponent } from "./playersInfo.js";
// VIEW 3
export function gamingView(mode, socket, playersInfos) {
  const contentContainer = document.createElement("div");
  contentContainer.id = "game-view-container";
  contentContainer.style = `
                          display: flex;
                          flex-direction: column;
                          gap: 6px;
                          max-width: 500px;
                          margin: 0 auto;
                          padding: 0.5em;
  
                            `;

  // toggles betwen chat and game board
  let toggleBetweenChatAndBoard = document.createElement("div");
  toggleBetweenChatAndBoard.style = `
                      width: 100%;
                      display: flex;
                      gap: .4em
      `;
  ["Game", "Chat"].forEach((option, index) => {
    let op = document.createElement("button");
    op.style = `
                  flex: 1;
                  scale: 1
        `;
    op.id = option;
    op.className = "btn";
    if (index == 0) {
      // set default active node
      op.classList.add("on");
    }

    op.innerText = option;
    toggleBetweenChatAndBoard.appendChild(op);
  });

  if (mode == "ai") {
    const APP_STATE = getState();

    console.log(APP_STATE);
    let humanAi = [
      {
        avatar: APP_STATE?.avatar,
        gametag: APP_STATE?.gametag,
        mark: APP_STATE.options?.mark,
        score: APP_STATE.gameScore?.player,
        userID: APP_STATE?.userID,
      },
      {
        avatar: "ai",
        gametag: "AI",
        score: APP_STATE.gameScore?.ai,
        userID: null,
      },
    ];

    const Infos = PlayerInfoComponent(humanAi);
    const board = Board();
    contentContainer.append(Infos, board);
  } else if (mode == "multiplayer") {
    let chatBtn = Array.from(toggleBetweenChatAndBoard.childNodes).find(
      (node) => node.id == "Chat"
    );

    const chat = Chat(chatBtn, socket, playersInfos);
    const board = Board();
    const Infos = PlayerInfoComponent(playersInfos); // this will be inside board compnt

    toggleBetweenChatAndBoard.onclick = (e) =>
      toggleView(e, board, chat, Infos);
    contentContainer.append(toggleBetweenChatAndBoard, Infos, board, chat);
  }
  //quit game
  const quit = document.createElement("button");
  quit.style = `
    margin: 0 auto;
    `;
  quit.classList.add("btn");
  quit.textContent = "Quit Game";
  quit.onclick = () => {
    // // clear persistant variables
    updateSTATE({
      ...getState(),
      gameScore: {
        player: 0,
        ai: 0,
      },
    });
    quit.setAttribute("data-navigate", "/gamemode");
  }; // take you back to gamemode(location change trigger socket clean it the ROUTER)
  contentContainer.appendChild(quit);

  return contentContainer;
}

// toggles between chat and game board
function toggleView(e, board, chat, playerInfos) {
  let target = e.target;
  let parentELement = Array.from(target.parentNode.childNodes);
  if (parentELement.some((el) => el.classList.contains("on"))) {
    parentELement.forEach((el) => el.classList.remove("on"));
  }

  if (target.id == "Game") {
    // chat button && chatview
    target.classList.add("on");
    chat.classList.add("hide");

    // board button && playersInfos
    board.classList.remove("hide");
    playerInfos.classList.remove("hide");
  }
  if (target.id == "Chat") {
    // chat button && chatview
    target.classList.add("on");
    chat.classList.remove("hide");

    // board button && playersInfos
    board.classList.add("hide");
    playerInfos.classList.add("hide");

    // new-message notification cleanup
    if (target.classList.contains("new-message")) {
      target.classList.remove("new-message");
    }
  }
}
