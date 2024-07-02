// views
const App = document.getElementById("app");
const avatars = ["anime", "vampire", "assassin"];
import * as localStore from "./localSaver.js";

var socket = null;

// APP STATE
// app state gotta be saved in session or local(app loses state on refresh)
// could use a localstorage or a storage manager
// and update when needed with this managers functions
let APP_STATE = {
  userID: null,
  gametag: "",
  avatar: "",
  gameMode: "",
  options: null,
  // will setErrors here
  errors: null,
  currentView: "",
};

// localSaving functionnalities
function saveUserProfile(data) {
  localStore.createUserProfile(data);
}

// GAME STATE
let {
  currentPlayer,
  player,
  ai,
  PLAYER_CLASS,
  initBoard,
  playersInfos,
  gameScore,
} = {
  currentPlayer: null,
  // will update depending on mark when initializing move
  player: "X",
  ai: "O",
  // ==========
  PLAYER_CLASS: {
    X: "x",
    O: "circle",
  },
  gameScore: {
    player: 0,
    ai: 0,
  },
  initBoard: Array(9).fill(""),
  playersInfos: null,
};

// RENDERS THE APP
// syncronous render
let renderView = (container, view) => {
  // render new view by removing old view
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(view);
};
// asyncronous render
function render(view, callBack, loadingMessage = "", condition = true) {
  // promise the view
  let currentView = new Promise((resolve, reject) => {
    setTimeout(() => {
      let v = view();
      if (v) {
        resolve(v);
      } else {
        reject(new Error("view failed to load"));
      }
    }, Math.floor(Math.random() * 1000));
  });

  // render loading state while resolving
  renderView(App, loadingComponent(loadingMessage));
  // resolved then render view(if condition is true)
  if (condition)
    currentView
      .then((view) => {
        renderView(App, view);
        if (callBack && typeof callBack == "function") {
          callBack(...arguments);
        }
      })
      .catch((e) => {
        console.log(e);
        APP_STATE.errors = { message: "error occured" };
        renderView(App, error());
      });
}

// VALIDATE DATA
function validate(appstate) {
  let errors;
  // returns false if value is falsy(using it without the new keyword it doesn't work)
  switch (appstate.currentView) {
    case "landingview":
      if (!appstate.avatar || !appstate.gametag) {
        errors = { valid: false, message: "avatar or username required " };
      } else {
        // on validate true save userData(prevent from saving same user twice)
        let users = localStore.getUsers();
        if (users && users.some((user) => user.userID == APP_STATE.userID))
          return;
        saveUserProfile({
          avatar: APP_STATE.avatar,
          gametag: APP_STATE.gametag,
          userID: APP_STATE.userID,
        });
      }
      break;
    case "choosegamemode":
      if (APP_STATE.gameMode == "ai") {
        if (!appstate.gameMode || !appstate.options) {
          errors = {
            valid: false,
            message: "mark or difficulty level required",
          };
        }
      }
      break;
    default:
      errors = { valid: false, message: "something wrong occured" };
  }
  if (!errors) return { valid: true };
  else return errors;
}

// COMPONENTS
// loading component
function loadingComponent(content) {
  let load = document.createElement("div");
  load.style = `
  display: grid;
  place-items: center;`;
  let message = document.createElement("p");
  message.textContent = content ? content : "";
  message.className = "loading-message";
  message.style = `
  color: white;
  font-size: .7rem;
  white-space: nowrap;
  `;

  load.id = "loading";
  let innerLoad = document.createElement("div");
  innerLoad.id = "inner-loading";

  load.append(message, innerLoad);
  return load;
}
function error() {
  let error = document.createElement("div");
  error.style = `
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 300px;
            width: 95%;
            max-height: 100px;
            background-color: white;
            border-radius: 5px;
            padding: .5em;
            color: red;
            text-align: center;
            font-size: 1rem;
  `;

  error.textContent = APP_STATE.errors?.message;
  return error;
}

// disconect socket
function cleanUpSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("socket disconnected");
  }
}

// ROUTER
let Router = new Navigo("/", { hash: true });

document.addEventListener("DOMContentLoaded", () => {
  // Initialize frontend router
  let routes = {
    "/": () => {
      render(
        landingView,
        () => {
          APP_STATE.currentView = "landingview";
          console.log("landing view");
        },
        `resolving landing view`
      );
      cleanUpSocket();
    },
    "/gamemode": () => {
      render(
        chooseGameMode,
        () => {
          APP_STATE.currentView = "choosegamemode";
          console.log("chose game mode view");
        },
        "resolving game mode view"
      );
      cleanUpSocket();
    },
    "/play/:mode": (params) => {
      if (params.data.mode == "ai") {
        render(
          () => gamingView("ai"),
          // initializes game for ai(offline) mode
          () => init("ai"),
          "initializing ai"
        );
      } else if (params.data.mode == "multiplayer") {
        socket = io();
        socket.emit("find-a-match", {
          avatar: APP_STATE?.avatar,
          gametag: APP_STATE?.gametag,
          userID: APP_STATE?.userID,
        });

        socket.on("game-found", (data) => {
          currentPlayer = data.first;
          playersInfos = data.players;
          render(
            () => gamingView("multiplayer"),
            // initializes game for multiplayer(online) mode
            () => init("multiplayer"),
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
      let result = validate(APP_STATE);

      if (result.valid) {
        Router.navigate(path);
      } else {
        APP_STATE.errors = result;
        App.appendChild(error());
      }
    }
  });
});

// VIEW COMPONENTS

// landingview component
function profiles() {
  // grab all saved profiles from local storage and append to an list of profiles
  // limits profiles to 5
  let profileContainer = document.createElement("div");

  profileContainer.className = "profile-container";
  profileContainer.style = `display: flex;
                            background-color:  rgb(104, 28, 196);
                            max-width: 400px;
                            gap: 1.2em;
                            overflow-x: scroll;
                            overflow-y: hidden;
                            white-space: nowrap;
                            cursor: pointer;
                            border-radius: 20px;
                            padding: .5em 2em`;

  let allUsers = localStore.getUsers();

  allUsers &&
    allUsers.forEach((user) => {
      let div = document.createElement("div");
      div.style = `text-align: center;`;
      div.id = `${user.userID}`;
      div.innerHTML = `
        <img style="width: 60px; height: 60px; border-radius: 50%" src="static/assets/${user.avatar}.jpeg" alt="avatar"/>
        <p style="color: yellow; font-size: .78rem;">${user.gametag}</p>
    `;
      profileContainer.append(div);
    });
  profileContainer.onclick = (e) => {
    const target = e.target;
    if (target.matches("img") || target.matches("p")) {
      const ID = target.parentNode.id;
      let data = localStore.getUserData({ userID: ID });
      console.log(data);
      APP_STATE = {
        ...APP_STATE,
        avatar: data.avatar,
        gametag: data.gametag,
        userID: data.userID,
      };
      Router.navigate("/gamemode");
    }
  };
  return allUsers ? profileContainer : null;
}

// VIEW 1
function landingView() {
  // landing page container
  let AvatarContainer = document.createElement("div");
  AvatarContainer.classList.add("content-container");

  let fragment = document.createDocumentFragment();

  // profiles saved profiles in ls renders if there's at least one
  // . circled avatar with name inside(append before h2)
  let userProfiles = profiles();
  let h1 = document.createElement("h1");
  h1.textContent = "PROFILES";
  h1.style = `
  color: yellow;
  margin-bottom: -20px;
  font-weight: 800;`;

  if (userProfiles) {
    fragment.append(h1, userProfiles);
  }

  // h2
  let h2 = document.createElement("h2");
  h2.textContent = "Choose An Avatar";
  h2.style.color = "white";
  fragment.appendChild(h2);

  // dynamiclly rendered imgs
  let imgContainer = document.createElement("div");
  imgContainer.classList.add("img-container");
  avatars.forEach((name) => {
    let avatarImg = document.createElement("img");
    avatarImg.src = `static/assets/${name}.jpeg`;
    avatarImg.id = name;
    avatarImg.alt = name;

    avatarImg.classList.add("avatar");
    imgContainer.appendChild(avatarImg);
  });
  fragment.appendChild(imgContainer);

  // select an avatar

  imgContainer.onclick = (e) => selectAvatar(e);

  // button
  let Next = document.createElement("button");
  Next.className = "btn";
  Next.textContent = "Next";
  Next.setAttribute("data-navigate", "/gamemode");
  fragment.appendChild(Next);

  // render on page
  AvatarContainer.appendChild(fragment);
  return AvatarContainer;
}

// landingview component
function renderGameTagInput(container) {
  let gameTagInput = document.createElement("input");
  gameTagInput.id = "game-tag";
  gameTagInput.placeholder = "enter username";
  gameTagInput.style = `
                  padding: .3em;
                  border:none;
                  border-bottom: 1px solid yellow;
                  outline: none;
                  background: none;
                  color: white;
                  `;
  gameTagInput.onchange = (e) => {
    console.log(e.target.value);
    // updates gameTagInput
    APP_STATE.gametag = e.target.value;
    APP_STATE.userID = APP_STATE.gametag + Date.now();
    console.log("gametag: ", APP_STATE.gametag, "userID: ", APP_STATE.userID);
  };

  container.insertAdjacentElement("afterend", gameTagInput);
}

// onclick event to select avatar(from landingview view)
function selectAvatar(e) {
  const target = e.target;
  let parentELements = Array.from(target.parentNode.childNodes);
  if (target.matches("img")) {
    if (parentELements.some((el) => el.classList.contains("active"))) {
      parentELements.forEach((el) => el.classList.remove("active"));
      document.getElementById("game-tag").remove();
    }
    target.classList.add("active");
    let showGametagInput = e.target.classList.contains("active");
    if (showGametagInput) {
      renderGameTagInput(target.parentNode);
    }
    // save the person's avatar here(use localstorage use the functions from mathmind to manipulate LS)
    console.log(e.target.id);
    // update avatar
    APP_STATE.avatar = e.target.id;
  }
}

// VIEW 2
function chooseGameMode() {
  let container = document.createElement("div");
  container.classList.add("content-container");

  let fragment = document.createDocumentFragment();
  let h2 = fragment.appendChild(document.createElement("h2"));
  h2.textContent = "Chose game Mode";
  h2.style.color = "white";

  // modes options
  let modeContainer = fragment.appendChild(document.createElement("div"));
  modeContainer.id = "mode-container";
  modeContainer.style = "display:flex; gap: 2em";

  // select mode (using event delegation)
  // ai
  let aiCard = ModeCard("ai");
  let multiplayerCard = ModeCard("multiplayer");

  // contains current options for active mode
  let aiOP = aiOptions();
  let multiplayerOP = multiplayerOptions();

  fragment.append(aiOP, multiplayerOP);
  modeContainer.onclick = (e) => selectMode(e, { aiOP, multiplayerOP });

  modeContainer.append(aiCard, multiplayerCard);

  container.appendChild(fragment);
  return container;
}

// choseGameMode component
const ModeCard = (mode) => {
  let title = document.createElement("h1");
  title.style.color = "white";
  title.textContent = `${mode.toUpperCase()}`;
  let img = document.createElement("img");
  img.classList.add("avatar");
  img.id = mode;
  img.src = `static/assets/${mode}.gif`;
  img.alt = mode;

  let div = document.createElement("div");
  div.style = `display:flex; 
              flex-direction: column;
              justify-items:center;
              align-items:center;
              gap: 1em;
              `;

  div.append(title, img);
  return div;
};

// ai options
function aiOptions() {
  let div = document.createElement("div");
  div.id = "ai-op";
  div.className = "hide";
  div.style = `
  display: flex;
  flex-direction: column;
  gap: 1em;
  width: 60%;
  `;

  let fieldset = document.createElement("fieldset");
  fieldset.style = `
  display: flex;
  gap:1em;
  justify-content: center;
  align-items: center;
  padding: .5em;
  border: 1px solid white;
  border-radius: 5px;
  color: white;
`;

  fieldset.innerHTML = `
  <legend>Choose Mark</legend>
  <label class="radio-label"><input type="radio" id="O" value="O" name="mark"/>circle</label>
  <label class="radio-label"><input type="radio" id="X" value="X" name="mark"/>cross</label>
  `;
  fieldset.onclick = (e) => {
    let target = e.target;
    if (target.matches("input[name=mark]:checked")) {
      APP_STATE.options = { ...APP_STATE.options, mark: target.value };
    }
  };

  let select = document.createElement("select");
  select.name = "difficulty";
  select.id = "difficulty-select";
  select.style = `
  font-size: .8rem;
  color: rgb(104, 28, 196);
  padding:.5rem;
  outline: none;
  border:1px solid white;
  border-radius: 5px;
  `;
  select.innerHTML = `
  <option value="">--choose difficulty level</option>
  <option value="easy">easy</option>
  <option value="medium">medium</option>
  <option value="hard">hard</option>
  `;
  select.onchange = (e) => {
    let target = e.target;
    APP_STATE.options = { ...APP_STATE.options, difficulty: target.value };
  };

  // Play AI
  const Play = document.createElement("button");
  Play.className = "btn";
  Play.textContent = "start";
  Play.setAttribute("data-navigate", "/play/ai");
  div.append(fieldset, select, Play);
  return div;
}
// multiplayer option
function multiplayerOptions() {
  // add id params in route handling for finding and creategame options
  let div = document.createElement("div");
  div.id = "multiplayer-op";
  div.className = "hide";
  div.style = `
  display: flex;
  flex-direction: column;
  gap: 1em;
  width: 60%;
`;

  // each button will have an :id param
  const findAMatch = document.createElement("button");
  findAMatch.className = "btn";
  findAMatch.textContent = "find a match";
  findAMatch.setAttribute("data-navigate", "/play/multiplayer");

  div.append(findAMatch);
  return div;
}

// onclick event to select mode(from choseGameMode view)
function selectMode(e, modeOptionContainer = {}) {
  const target = e.target;
  let parentELements = Array.from(target.parentNode.parentNode.childNodes);
  let mergedElements = parentELements
    .map((el) => Array.from(el.childNodes))
    .flat();
  if (target.matches("img")) {
    // switch gamemode
    if (mergedElements.some((el) => el.classList.contains("active"))) {
      mergedElements.forEach((el) => el.classList.remove("active"));
    }
    // sets gameMode
    // updates gamemode
    APP_STATE.gameMode = target.id;
    target.classList.add("active");
    let { aiOP, multiplayerOP } = modeOptionContainer;
    if (target.id == "ai") {
      aiOP.classList.remove("hide");
      multiplayerOP.classList.add("hide");
    }
    if (target.id == "multiplayer") {
      multiplayerOP.classList.remove("hide");
      aiOP.classList.add("hide");
    }
  }
}

// VIEW 3
function gamingView(mode) {
  const contentContainer = document.createElement("div");
  contentContainer.id = "game-view-container";
  contentContainer.style = `
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-around;
                        gap: .5em;
                        max-width: 500px;
                        width: 100%;
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
    let humanAi = [
      {
        avatar: APP_STATE?.avatar,
        gametag: APP_STATE?.gametag,
        mark: APP_STATE.options?.mark,
        score: gameScore?.player,
        userID: APP_STATE?.userID,
      },
      {
        avatar: "ai",
        gametag: "AI",
        score: gameScore?.ai,
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

    const chat = Chat(chatBtn);
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
    // clear persistant variables
    initBoard = Array(9).fill("");
    gameScore = {
      player: 0,
      ai: 0,
    };
    Router.navigate("/gamemode");
  }; // take you back to gamemode(location change trigger socket clean it the ROUTER)
  contentContainer.appendChild(quit);

  return contentContainer;
}

// gameview component || Board subComponent
function PlayerInfoComponent(playersArray) {
  console.log(playersArray);
  let container = document.createElement("div");
  container.style = `
    width: 100%;
    display: flex;
    background-color: rgb(104, 28, 196);
    padding: .5em 1.2em;
    border-radius: 10px;
    justify-content: space-between;
`;
  if (playersArray && playersArray.length == 2) {
    let player =
      playersArray &&
      playersArray.find((player) => player.userID === APP_STATE.userID);

    let oponent =
      playersArray &&
      playersArray.find((player) => player.userID !== APP_STATE.userID);

    console.log("player: ", player?.userID);
    console.log("oponent: ", oponent?.userID);

    [player, oponent].forEach((player, index) => {
      let playerIF = document.createElement("div");
      playerIF.className = "player-info";
      playerIF.innerHTML = `
                      <img src="static/assets/${
                        player.avatar
                      }.jpeg" alt="avatar" style="width: 50px;height:50px"/>
                      <p class="gametag" style="font-size: .89rem; color: white;">${
                        player.gametag
                      }</p>
                      <p class="score" style="font-size: .7rem; color: yellow; font-weight: 700;">score: ${
                        player.score
                      }</p>
                      ${
                        index == 0
                          ? `<p class="mark" style="font-size: .69rem; color: yellow; font-weight: 700; white-space:nowrap;">you're playing as ${player.mark}</p>`
                          : ""
                      }`;
      container.appendChild(playerIF);
    });
  } else
    container.innerHTML = `<p style="color: red; font-size:1.2rem;">error loading players data</p>`;
  return container;
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

// game board
function Board() {
  let fragment = document.createElement("div");
  fragment.className = "Board";

  // Create reset container
  const resetContainer = document.createElement("div");
  resetContainer.classList.add("reset-container");

  const winnerDisplay = document.createElement("p");
  winnerDisplay.id = "winner";
  winnerDisplay.style.color = "white";
  resetContainer.appendChild(winnerDisplay);

  const resetButton = document.createElement("button");
  resetButton.className = "btn";
  resetButton.id = "reset";
  resetButton.textContent = "restart";

  resetContainer.appendChild(resetButton);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("xmlns", svgNS);
  svg.setAttribute("viewBox", "0 0 512 512");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute(
    "d",
    "M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"
  );
  svg.appendChild(path);
  resetButton.appendChild(svg);

  fragment.appendChild(resetContainer);

  // Create container
  const container = document.createElement("div");
  container.classList.add("container");

  const title = document.createElement("h3");
  title.textContent = "Tic Tac Toe";

  // player turn
  let playerTurn = document.createElement("p");
  playerTurn.id = "player-turn";
  playerTurn.style = `
                    padding: .3em;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: white;`;
  title.insertAdjacentElement("beforeend", playerTurn);

  container.appendChild(title);

  // Create board
  const board = document.createElement("ul");
  board.id = "spots";

  for (let i = 0; i < 9; i++) {
    const li = document.createElement("li");
    board.appendChild(li);
  }

  // Create strike element
  const strike = document.createElement("div");
  strike.id = "strike";
  strike.classList.add("strike");
  board.appendChild(strike);

  container.appendChild(board);
  fragment.appendChild(container);
  return fragment;
}

// chat component
function Chat(button) {
  let chatContainer = document.createElement("div");
  chatContainer.className = "Chat hide";
  chatContainer.style = `
                  display: flex;
                  justify-content: space-between;
                  flex-wrap: column-wrap;
                  flex-direction: column;
                  padding: .5em;
                  background-color: white;
                  width: 100%;
                  height: 500px;
                  min-height: 80%;
                  margin-top: 1.2em;
  `;

  let fragment = document.createDocumentFragment();

  // top side of chat(display recipient)
  let topOfChat = document.createElement("div");
  topOfChat.style = `
          padding: .5em;
          text-align:center;
          border-bottom: 1px solid gray;
  `;
  let chatTitle = document.createElement("h1");
  chatTitle.style.color = "gray";
  // set name of receiver

  const oponent =
    playersInfos &&
    playersInfos.find((player) => player.socketID !== socket.id);

  chatTitle.textContent = (oponent && oponent.gametag) || "(oponent name)";
  // will create something to close chat(or minimize)
  topOfChat.append(chatTitle);

  // all the messages will be displayed here
  //(will dynamiclly add it here when everything is done being rendered)
  // with init() when game is initialized
  let messageList = document.createElement("div");
  messageList.id = "message-list";
  messageList.style = `
                  display: flex;
                  flex-direction: column;
                  gap: .6em;
                  flex: 1;
                  overflow-y: auto;
                  padding: 10px;
  `;

  // input to send messge
  let messageFormContainer = document.createElement("div");
  messageFormContainer.style = `
                        display:flex;
                        align-items: flex-end;
                        gap: .5em;
                        border-top: 1px solid gray;
                        padding: .5em;
  `;
  let msgInput = document.createElement("textarea");
  msgInput.className = "message-input";
  msgInput.placeholder = "type a message...";
  msgInput.style = `
  width: 100%;
  height: 40px;
  padding: .3em;
  outline: none;
  border: 1px solid gray;
  border-radius: 5px;
  font-size: 1rem;
  max-height: 200px;
  resize: none; // disable manual resizing
// might need pollyfills for brwsr support
                  `;

  msgInput.addEventListener("keyup", (e) => {
    const target = e.target;
    target.style.height = "40px";
    let newHeight = target.scrollHeight;
    target.style.height = `${newHeight}px`;
  });

  let msgSubmitButton = document.createElement("div");
  msgSubmitButton.className = "send-btn";

  // msgSubmitButton.className = "btn";
  msgSubmitButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;

  // on send-btn pres
  msgSubmitButton.onclick = () => {
    if (msgInput.value.trim() != "") {
      // append message as sender(set side to right else left)
      appendMessage(APP_STATE?.avatar, "right", msgInput.value, messageList);
      socket.emit("send-message", msgInput.value);
    }
    msgInput.value = "";
    msgInput.style.height = "50px";
  };

  socket.on("message-recieved", (data) => {
    console.log("recieved", data.message);
    // notify new message
    if (!button.classList.contains("on")) {
      button.classList.add("new-message");
    }
    appendMessage(oponent?.avatar, "left", data.message, messageList);
  });

  messageFormContainer.append(msgInput, msgSubmitButton);

  fragment.append(topOfChat, messageList, messageFormContainer);
  chatContainer.appendChild(fragment);
  return chatContainer;
}

// chat component -> inner component(messages)
function appendMessage(avatar, side, message, container) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg ${side}">
    <!-- avatar possibly might not make it to final product 
    -->
    <img class="chat-avatar" src="static/assets/${avatar}.jpeg" alt="${avatar}">
    <!-- message content and time -->
      <div class="msg-bubble">
          <p class="msg-content">${message}</p>
          <p class="msg-time">${formatDate(new Date())}</p>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", msgHTML);
  container.scrollTop += 500;
}

// UTILS(format time)
function formatDate(time) {
  let t = time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return t;
}

// runs when there are in game loading
function gameLoadingComponent() {
  let loadingContainer = document.createElement("div");
  loadingContainer.style = `  
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: rgb(104, 28, 196, 0.9);
  backdrop-filter: blur(10px);
  z-index: 1000;`;
  let loading = loadingComponent("waiting for other player...");
  loadingContainer.appendChild(loading);
  return loadingContainer;
}

// initializes the game(does game logic and ui all ui manipulations)
function init(mode) {
  console.log("game initialized...", mode);

  const board = document.querySelectorAll("li");
  const winnerDisplay = document.getElementById("winner");
  const resetButton = document.getElementById("reset");
  const strike = document.getElementById("strike");
  const playerTurn = document.getElementById("player-turn");
  const score = document.querySelectorAll("p.score");
  const loading = gameLoadingComponent();

  // start game
  // decides who goes first (similar to an init function)
  function whichIsFirst(gameMode) {
    if (gameMode == "ai") {
      console.log("initializing move...");
      // override players marks(if player chooses a mark)
      player = APP_STATE.options?.mark || "X";
      ai = player == "X" ? "O" : "X";

      let randomFirst = Math.random() < 0.5 ? "human" : "ai";
      if (randomFirst == "ai") {
        // playerTurn.textContent = `${ai}'s move`;
        // if aiMove gets delayed can use code above
        aiMove();
        currentPlayer = player;
        updateUI();
      } else {
        playerTurn.textContent = `${player}'s move`;
        currentPlayer = player;
      }
    } else if (gameMode == "multiplayer") {
      console.log("initializing move...");
      playerTurn.textContent = `${currentPlayer}'s move`;
    }
  }
  whichIsFirst(mode); // only for ai mode
  // +++++ UI MANIPULATIONS +++++++

  // EVENT LISTENERS( only attach when items are rendered)
  // reset game
  resetButton.addEventListener("click", () => {
    if (mode == "multiplayer") {
      resetButton.parentNode.appendChild(loading);
      let { winner } = checkWin();
      socket.emit("restart", {
        winner: winner,
        reset: true,
        playersInfos: playersInfos,
      });

      // avoid double click and reset game by same player(might find a way to do it on the server too)
      resetButton.disabled = true;
      return;
    } else {
      let { winner } = checkWin();
      if (winner == player) {
        let newScore = gameScore.player + 1;
        score[0].textContent = `score: ${newScore}`;
        gameScore.player = newScore;
      } else if (winner == ai) {
        let newScore = gameScore.ai + 1;
        score[1].textContent = `score: ${newScore}`;
        gameScore.ai = newScore;
      }
    }
    showRestart(false);
    setTimeout(reset, 500);
  });

  socket &&
    socket.on("game-ready", (data) => {
      // this will be true if both players submit resetbtn
      if (data.reset) {
        // re-enable button and clear reset container
        resetButton.parentNode.removeChild(loading);
        resetButton.disabled = false;
        showRestart(false);
        setTimeout(reset, 500);

        // reenable game(&update score &playersI)
        let player = data.players.find(
          (player) => player.userID === APP_STATE.userID
        );
        let oponent = data.players.find(
          (player) => player.userID !== APP_STATE.userID
        );
        score[0].textContent = `score: ${player.score}`;
        score[1].textContent = `score: ${oponent.score}`;

        currentPlayer = data.first;
        playersInfos = data.players;
      }
    });

  //move
  board.forEach((spot, index) => {
    spot.addEventListener("click", () => {
      handleMove(index);
    });
  });
  // =====

  // functions to manipulate ui when events are triggered

  // update UI
  function updateUI() {
    for (let i = 0; i < initBoard.length; i++) {
      let player = initBoard[i];
      if (player) board[i].classList.add(PLAYER_CLASS[player]);
    }
    if (currentPlayer) playerTurn.textContent = `${currentPlayer}'s move`;

    let { winner, strikeClass } = checkWin();
    if (winner) {
      displayWinner(winner);
      showRestart(true);
      strikeWinPos(strikeClass);
      return;
    }
  }

  // strike accross winning positions.
  function strikeWinPos(strikeClass) {
    strike.classList.add(strikeClass);
  }

  // reset the board
  function reset() {
    winnerDisplay.innerText = "";
    playerTurn.textContent = "";
    let { strikeClass } = checkWin();
    strike.classList.remove(strikeClass);
    // reset board UI
    board.forEach((el) => {
      el.classList.remove(PLAYER_CLASS.X, PLAYER_CLASS.O);
    });
    // resets virtual board
    initBoard = Array(9).fill("");
    whichIsFirst(mode); // reset who goes first(by grabbing gamemode)
    console.log("restart", mode, "currentPLayer: ", currentPlayer);
  }

  // prompt to restart
  function showRestart(state) {
    resetButton.parentNode.style.display = state ? "flex" : "none";
  }
  // displays winner
  function displayWinner(player) {
    let message = {
      X: "X's win",
      O: "O's win",
      tie: "it's a tie",
    };
    winnerDisplay.innerText = message[player];
  }

  // +++++++ GAME LOGIC ++++++ (uses a virtual board)
  // player goes first(cell onclick)
  function handleMove(moveIndex) {
    if (!currentPlayer) return;
    let { winner } = checkWin();
    if (winner) return;

    if (mode == "ai") {
      if (currentPlayer == player) {
        if (initBoard[moveIndex] === "") {
          initBoard[moveIndex] = player;
          currentPlayer = ai;
          updateUI();
        }
        if (currentPlayer == ai) {
          setTimeout(() => {
            aiMove(initBoard);
            currentPlayer = player;
            updateUI();
          }, 500);
        }
      }
    } else if (mode == "multiplayer") {
      socket.emit("move", {
        index: moveIndex,
        currentPlayer: currentPlayer,
      });
    }
  }

  // handle moves made
  if (socket)
    socket.on("move-made", (data) => {
      if (initBoard[data.move] !== "") return;
      initBoard[data.move] = data.mark;
      currentPlayer = data.currentPlayer == "X" ? "O" : "X";
      updateUI();
    });

  // ai bestmove that uses minimax algorithm
  function aiMove() {
    let bestScore = -Infinity;
    let bestMove;
    for (let i = 0; i < initBoard.length; i++) {
      if (initBoard[i] == "") {
        initBoard[i] = ai;
        // initial minimax call
        let score = minimax(
          initBoard,
          9,
          false,
          // a
          -Infinity,
          // ß
          Infinity
        );
        initBoard[i] = "";

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    initBoard[bestMove] = ai;
  }

  // minimax algorithm
  function minimax(currentBoard, depth, isMaximizing, a, ß) {
    let { winner: result } = checkWin();
    if (result != null || depth == 0) {
      if (result == player) {
        return -10;
        //ai is maximizing
      } else if (result == ai) {
        return 10;
      } else {
        return 0;
      }
    }

    // AI is maximizing(trying to maximize its score)
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < currentBoard.length; i++) {
        if (currentBoard[i] == "") {
          currentBoard[i] = ai;
          let score = minimax(currentBoard, depth - 1, false);
          currentBoard[i] = "";
          maxEval = Math.max(score, maxEval);

          //pruning
          if (maxEval >= ß) return maxEval;
          a = Math.max(a, maxEval);
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < currentBoard.length; i++) {
        if (currentBoard[i] == "") {
          currentBoard[i] = player;
          let score = minimax(currentBoard, depth - 1, true);
          currentBoard[i] = "";
          minEval = Math.min(score, minEval);

          //pruning
          if (minEval <= a) return minEval;
          ß = Math.min(ß, minEval);
        }
      }

      return minEval;
    }
  }

  // check if someone wins and return true
  function checkWin() {
    let state = { winner: null, strikeClass: null };
    const winningCombinations = [
      //Rows
      { combo: [0, 1, 2], strikeClass: "strike-row-1" },
      { combo: [3, 4, 5], strikeClass: "strike-row-2" },
      { combo: [6, 7, 8], strikeClass: "strike-row-3" },

      //Columns
      { combo: [0, 3, 6], strikeClass: "strike-column-1" },
      { combo: [1, 4, 7], strikeClass: "strike-column-2" },
      { combo: [2, 5, 8], strikeClass: "strike-column-3" },

      //Diagonals
      { combo: [0, 4, 8], strikeClass: "strike-diagonal-1" },
      { combo: [2, 4, 6], strikeClass: "strike-diagonal-2" },
    ];
    for (let i = 0; i < winningCombinations.length; i++) {
      // goes through every win postion and check for win
      let [a, b, c] = winningCombinations[i].combo;
      if (
        initBoard[a] == initBoard[b] &&
        initBoard[a] == initBoard[c] &&
        initBoard[a] != ""
      ) {
        state = {
          winner: initBoard[a],
          strikeClass: winningCombinations[i].strikeClass,
        };
        return state;
      }
    }

    // if no one wins
    if (!initBoard.includes("")) {
      state.winner = "tie";
      return state;
    }
    // no winner yet
    return state;
  }
}
