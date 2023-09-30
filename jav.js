const board = document.querySelectorAll("li");
    const winnerDisplay = document.getElementById("winner");
    let human = "X";
    let ai = "O";
    let nextMove = true;

    board.forEach((spot) => {
      spot.addEventListener("click", (e) => {
        game(e);
      });
    });

    function game(e) {
      const target = e.target;
      if (checkWin() === human || checkWin() === ai) return;
      if (target.innerText !== "") return;

      target.innerText = human;

      if (checkWin() === human) {
        winnerDisplay.innerText = `${human} wins`;
      } else if (checkWin() === "tie") {
        winnerDisplay.innerText = "Tie Game!";
      } else {
        nextMove = false;
          bestMove();
        // setTimeout(bestMove, 500); // Delay AI move for better user experience
      }
    }

    function bestMove() {
      let bestScore = -Infinity;
      let move;

      for (let i = 0; i < 9; i++) {
        if (board[i].innerText == "") {
          board[i].innerText = ai;
          let score = minimax(board, 3, false);
          board[i].innerText = "";
          if (score > bestScore) {
            bestScore = score;
            move = i;
          }
        }
      }

      board[move].innerText = ai;

      if (checkWin() === ai) {
        winnerDisplay.innerText = `${ai} wins`;
      } else if (checkWin() === "tie") {
        winnerDisplay.innerText = "Tie Game!";
      }

      nextMove = true;
    }

    let scores = {
      X: -1,
      O: 1,
      tie: 0,
    };

    function minimax(board, depth, isMaximizing) {
      let result = checkWin();
      if (result != null || depth == 0) {
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
        let [a, b, c] = winPositions[i];

        if (
          board[a].innerText === board[b].innerText &&
          board[b].innerText === board[c].innerText
        ) {
          winner = board[a].innerText;
        }
      }

      let tie = board.every((spot) => spot.innerText !== "");
      if (!winner && tie) {
        return "tie";
      }

      return winner;
    }
