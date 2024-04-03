const board = document.querySelectorAll("li");
const winnerDisplay = document.getElementById("winner");

let nextMove = true;
let human = "X";
let ai = "O";

board.forEach((spot, index) => {
  spot.addEventListener("click", () => {
    humanMove(index);
  });
});

let initBoard = ["", "", "", "", "", "", "", "", ""];

// // reset the board
function reset() {
  board.forEach((spot) => {
    spot.innerText = "";
  });
  nextMove = true;
  winnerDisplay.innerText = "";
  initBoard = ["", "", "", "", "", "", "", "", ""];
}

// // reset button
let isReset = false;
const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", () => {
  if (isReset) resetButton.parentNode.style.display = "none";

  // reset the board
  setTimeout(reset, 300);
  initBoard = ["", "", "", "", "", "", "", "", ""];
  
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
  if (checkWin() == human || checkWin() == ai) return;

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

// ai bestmove that uses minimax algorithm
function aiMove(initBoard) {
  let bestScore = -Infinity;
  let bestMove;
  for (let i = 0; i < initBoard.length; i++) {
    if (initBoard[i] == "") {
      initBoard[i] = ai;
      let score = minimax(
        initBoard,
        initBoard.length,
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
  //update dom board
  updateUI();
  if (checkGameStatus()) return;

  nextMove = true;
}

// minimax algorithm
function minimax(currentBoard, depth, isMaximizing, a, ß) {
  let result = checkWin();
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
  let winPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < winPositions.length; i++) {
    // goes through every win postion and check for win
    let [firstSpot, secondSpot, thirdSpot] = winPositions[i];
    if (
      initBoard[firstSpot] == initBoard[secondSpot] &&
      initBoard[firstSpot] == initBoard[thirdSpot] &&
      initBoard[firstSpot] != ""
    ) {
      return initBoard[firstSpot];
    }
  }

  if (!initBoard.includes("")) {
    return "tie";
  }

  // if no one wins
  return null;
}

function checkGameStatus() {
  let winner = checkWin();
  if (winner) {
    displayWinner(winner);
    isReset = true;
    resetButton.parentNode.style.display = "block";
    return true;
  }
  return false;
}

function displayWinner(player) {
  let message = {
    tie: "tie ❌",
    X: "you won ✅",
    O: "you lost ❌ ",
  };
  winnerDisplay.innerText = message[player];
}
