const board = document.querySelectorAll("li");
const winnerDisplay = document.getElementById("winner");

let nextMove = true;
let human = "X";
let ai = "O";

board.forEach((spot) => {
  spot.addEventListener("click", (e) => {
    humanMove(e);
  });
});

function humanMove(e) {
  const target = e.target;
  if (nextMove) {
    if (target.innerText == "") {
      target.innerText = human;
      displayWinner(human);
      nextMove = false;
      aiMove();
    }
  }
  console.log(board.innerText);
}

// ai bestmove that uses minimax algorithm
function aiMove() {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < 9; i++) {
    if (board[i].innerText == "") {
      board[i].innerText = ai;
      let score = minimax(board, 4, true);
      board[i].innerText = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  console.log(move);
  board[move].innerText = ai;
  displayWinner(ai);
  nextMove = true;
}

// score ratings for maximizing player and minimizing player
let scores = {
  X: -1,
  O: 1,
  tie: 0,
};
// minimax algorithm
function minimax(board, depth, isMaximizing) {
  let result = checkWin();
  if (result != null) {
    return scores[result];
  }
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i].innerText == "") {
        board[i].innerText = human;
        let score = minimax(board, depth - 1, false);
        board[i].innerText = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i].innerText == "") {
        board[i].innerText = ai;
        let score = minimax(board, depth - 1, true);
        board[i].innerText = "";
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

// check if someone wins and return true
function checkWin() {
  let winner = null;
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
      (board[firstSpot].innerText === board[secondSpot].innerText &&
        board[secondSpot].innerText === board[thirdSpot].innerText &&
        board[thirdSpot].innerText === human) ||
      (board[firstSpot].innerText === board[secondSpot].innerText &&
        board[secondSpot].innerText === board[thirdSpot].innerText &&
        board[thirdSpot].innerText === ai)
    ) {
      winner = board[firstSpot].innerText;
    }
  }
  let tie = 0;
  for (let v = 0; v < board.length; v++) {
    if (board[v].innerText != "") {
      tie++;
    }
  }

  if (winner === null && tie > 8) {
    return "tie";
  } else {
    return winner;
  }
}

function displayWinner(player) {
  if (checkWin() == player) {
    winnerDisplay.innerText = `${player} wins`;
    return;
  } else if (checkWin() == player) {
    winnerDisplay.innerText = `${player} wins`;
    return;
  } else if (checkWin() == "tie") {
    winnerDisplay.innerText = "Tie";
    return;
  }
}
