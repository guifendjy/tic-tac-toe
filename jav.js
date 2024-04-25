const board = document.querySelectorAll("li");
const winnerDisplay = document.getElementById("winner");
const resetButton = document.getElementById("reset");

let nextMove = true;
let human = "X";
let ai = "O";
let initBoard = Array(9).fill("");

board.forEach((spot, index) => {
  spot.addEventListener("click", () => {
    humanMove(index);
  });
});

function strikeWinPos(winningPositions) {
  winningPositions &&
    winningPositions.forEach(
      (pos) => (board[pos].style.backgroundColor = "red")
    );
}

// // reset the board
function reset() {
  board.forEach((spot) => {
    spot.innerText = "";
    spot.style.backgroundColor = "lightgray";
  });
  nextMove = true;
  winnerDisplay.innerText = "";
}

// // reset button
resetButton.addEventListener("click", () => {
  showRestart(false);
  // reset the board
  setTimeout(reset, 500);
  initBoard = Array(9).fill("");
});

// update UI
function updateUI() {
  for (let i = 0; i < initBoard.length; i++) {
    board[i].innerText = initBoard[i];
  }
}

// human goes first
function humanMove(humanPlayerIndex) {
  if (!nextMove) return;
  let { winner } = checkWin();
  if (winner == human || winner == ai) return;

  if (nextMove) {
    if (initBoard[humanPlayerIndex] === "") {
      initBoard[humanPlayerIndex] = human;

      //update dom board
      updateUI(human);
      if (checkGameStatus()) return;
      nextMove = false;
      if (!nextMove) aiMove(initBoard);
    }
  }
}

// I can memoize it by storing the previous
// highest score and best move for ai, and
//if there are not any other best move I then return
// the memoized one, makes the ai less performant but
//avoids searching for all possibilties(winning routes).

// ai bestmove that uses minimax algorithm
function aiMove(initBoard) {
  let bestScore = -Infinity;
  let bestMove;
  for (let i = 0; i < initBoard.length; i++) {
    if (initBoard[i] == "") {
      initBoard[i] = ai;
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
      console.log(score);

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  initBoard[bestMove] = ai;
  //update dom board
  updateUI();
  if (checkGameStatus()) return;
  nextMove = true;
}

// minimax algorithm
function minimax(currentBoard, depth, isMaximizing, a, ß) {
  let { winner: result } = checkWin();
  if (result != null || depth == 0) {
    if (result == human) {
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
        currentBoard[i] = human;
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
  let state = { winner: null, winPositions: null };
  let winPositions = [
    //horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    //vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    //diagonal
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < winPositions.length; i++) {
    // goes through every win postion and check for win
    let [a, b, c] = winPositions[i];
    if (
      initBoard[a] == initBoard[b] &&
      initBoard[a] == initBoard[c] &&
      initBoard[a] != ""
    ) {
      state = { winner: initBoard[a], winPositions: [a, b, c] };
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

// checks the game status
function checkGameStatus() {
  let { winner, winPositions } = checkWin();
  if (winner) {
    displayWinner(winner);
    strikeWinPos(winPositions);
    showRestart(true);
    return true;
  }
  return false;
}

// restart button alert
function showRestart(state) {
  resetButton.parentNode.style.display = state ? "block" : "none";
}

// displays winner
function displayWinner(player) {
  let message = {
    tie: "tie ❌",
    X: "you won ✅",
    O: "you lost ❌ ",
  };
  winnerDisplay.innerText = message[player];
}
