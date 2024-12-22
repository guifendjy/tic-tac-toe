import { loadingComponent } from "./loading.js";
import { getState, updateSTATE } from "./state.js";

// GAME STATE
let { currentPlayer, player, ai, PLAYER_CLASS, initBoard, playersInfos } = {
  currentPlayer: null,
  // will update depending on mark when initializing move
  player: "X",
  ai: "O",
  // ==========
  PLAYER_CLASS: {
    X: "x",
    O: "circle",
  },
  initBoard: Array(9).fill(""),
  playersInfos: null,
};

// game board
export function Board() {
  let boardContainer = document.createElement("div");
  boardContainer.className = "Board";

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

  boardContainer.appendChild(resetContainer);

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
  boardContainer.appendChild(container);
  return boardContainer;
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
export function init(mode, socket, current, playersArr) {
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
    // // clears board and score on reinitializations
    if (gameMode == "ai") {
      console.log("initializing move...");
      // override players marks(if player chooses a mark)
      const currentState = getState();

      player = currentState.options?.mark || "X";
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
      currentPlayer = current;
      playersInfos = playersArr;

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
        let { gameScore } = getState();
        let newScore = gameScore.player + 1;
        score[0].textContent = `score: ${newScore}`;
        // gameScore.player = newScore;
        updateSTATE({
          ...getState(),
          gameScore: { ...gameScore, player: newScore },
        });
      } else if (winner == ai) {
        let { gameScore } = getState();
        let newScore = gameScore.ai + 1;
        score[1].textContent = `score: ${newScore}`;
        // gameScore.ai = newScore;
        updateSTATE({
          ...getState(),
          gameScore: { ...gameScore, ai: newScore },
        });
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
        const APP_STATE = getState();

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
