var board = document.querySelectorAll("li");
var winnerDisplay = document.getElementById("winner");
var nextMove = true;

board.forEach((spot) => {
  spot.addEventListener(
    "click",
    (e) => {
      game(e);
    },
    false
  );
});
let human = "X";
let ai = "O";

function game(e) {
  const target = e.target;
  if (checkWin() === human || checkWin() === ai) return;
  if (target.innerText != "") return;
  if (nextMove) {
    target.innerText = human;
    if (checkWin() === human) {
      winnerDisplay.innerText = `${human} wins`;
      console.log(`${human} wins`);
    }
    nextMove = false;
    // ai move next(not working)
    bestMove();
  } else {
    // manual
    target.innerText = ai;
    if (checkWin() === ai) {
      winnerDisplay.innerText = "O wins";
      console.log("O wins");
    }
    nextMove = true;
  }
  if (checkWin() === "tie") {
    winnerDisplay.innerText = "tie";
  }
}

// ai bestmove that uses minimax algorithm
function bestMove() {
  var bestScore = -Infinity;
  let move;
  for (var i = 0; i < 9; i++) {
    if (board[i].innerText == "") {
      board[i].innerText = ai;
      let score = minimax(board, 0, false);
      board[i].innerText = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  console.log(move);
  board[move].innerText = ai;
  if (checkWin() === ai) {
    winnerDisplay.innerText = "you lost";
    console.log(`${ai} wins`);
  }
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
  var result = checkWin();
  if (result != null) {
    return scores[result];
  }
  if (isMaximizing) {
    var bestScore = -Infinity;
    for (var i = 0; i < 9; i++) {
      if (board[i].innerText == "") {
        board[i].innerText = human;
        let score = minimax(board, depth + 1, false);
        board[i].innerText = "";
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    var bestScore = Infinity;
    for (var i = 0; i < 9; i++) {
      if (board[i].innerText == "") {
        board[i].innerText = ai;
        let score = minimax(board, depth + 1, true);
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
  var winPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (var i = 0; i < winPositions.length; i++) {
    // goes through every win postion and check for win
    var firstSpot, secondSpot, thirdSpot;
    [firstSpot, secondSpot, thirdSpot] = winPositions[i];
    // test -----
    // console.log(firstSpot, secondSpot, thirdSpot);
    // console.log(board[firstSpot], board[secondSpot], board[thirdSpot]);
    // console.log(board.innerText);
    // -------
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
  for (var v = 0; v < board.length; v++) {
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
