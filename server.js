const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { join } = require("node:path");

const app = express();
const server = createServer(app);

//matched players
const Players = {};

// queues
let restartQueue = createQueue();
let messageQueue = createQueue();
let waitingPlayerQueue = createQueue();

// results of queues
let readyToRestart = {};

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("connecting...");
  // INITIALIZES ROOMS(for matched players)
  socket.on("find-a-match", ({ avatar, gametag, userID }) => {
    console.log(userID, "looking for a match...");

    Players[socket.id] = {
      // client
      userID: userID,
      avatar: avatar,
      gametag: gametag,

      // server
      socket: socket,
      room: null,
      mark: null,
      oponent: null,
    };

    waitingPlayerQueue.enQueue(socket.id);
    console.log("queue size: ", waitingPlayerQueue.size());

    if (waitingPlayerQueue.size() === 2) {
      let player1 = waitingPlayerQueue.dequeue();
      let player2 = waitingPlayerQueue.dequeue();

      matchPlayers(player1, player2);
      console.log(
        "game ready",
        Players[player1].userID,
        "vs",
        Players[player2].userID
      );
      console.log("active players: ", Object.keys(Players).length);
      console.table(Players);
    } else {
      io.to(socket.id).emit("game-found", {
        found: false,
        loadingMessage: "searching for players...",
      });
      console.log(Players[socket.id].userID, "is waiting for a match");
    }
  });

  // on disconection
  socket.on("disconnect", () => {
    let disconnectedSocket = Players[socket.id];

    if (disconnectedSocket && disconnectedSocket.oponent) {
      let oponentID = disconnectedSocket.oponent;

      let oponentSocket = Players[oponentID];
      if (oponentSocket && oponentSocket.socket.connected) {
        io.to(oponentSocket.room).emit("game-found", {
          found: false,
          loadingMessage: "player left, waiting for new player...",
        });

        // make it available for matching again
        waitingPlayerQueue.enQueue(oponentID);

        // they get overriden but just to make sure(on matches)
        // delete Players[oponentID].oponent;
        // delete Players[oponentID].room;
        // delete Players[oponentID].mark;
      } else {
        // if oponent is also disconnected
        waitingPlayerQueue.remove(oponentID);
        delete Players[oponentID];
      }
    }

    if (disconnectedSocket) {
      // clear ou disconected player
      console.log(disconnectedSocket && disconnectedSocket.socket.id, "left");
      delete Players[disconnectedSocket.socket.id];
      waitingPlayerQueue.remove(disconnectedSocket.socket.id);
    }
  });

  //GAME MOVES
  socket.on("move", ({ index, currentPlayer }) => {
    const currentSocket = Players[socket.id];
    if (!currentSocket || !currentSocket.oponent) return;

    const room = currentSocket.room;
    // validates moves before allowing move
    if (currentPlayer !== currentSocket.mark) {
      return;
    }
    let data = {
      move: index,
      mark: currentPlayer,
      currentPlayer: currentPlayer,
    };

    io.to(room).emit("move-made", data);
  });

  // ON RESTART
  socket.on("restart", ({ winner, reset, playersInfos }) => {
    restartQueue.enQueue((done) => {
      const currentSocket = Players[socket.id];
      const room = currentSocket.room;

      if (!readyToRestart[room]) readyToRestart[room] = [];

      readyToRestart[room].push(reset);
      if (
        readyToRestart[room].length == 2 &&
        readyToRestart[room].every((bool) => !!bool)
      ) {
        let updatedPlayerArray = playersInfos.map((player) => {
          if (winner === player.mark) {
            return { ...player, score: player.score + 1 };
          } else {
            return { ...player };
          }
        });

        let first = Math.random() < 0.5 ? "X" : "O";
        // can math winner with a socket and assign a score++
        io.to(room).emit("game-ready", {
          reset: true,
          first: first,
          players: updatedPlayerArray,
        });
        // clears if both are ready
        readyToRestart[room] = [];

        updatedPlayerArray.forEach((player) => {
          console.log(player.gametag, "score: ", player.score);
        });
        // signals event is done processing
        console.log(
          "restarted",
          readyToRestart[room].every((bool) => !!bool)
        );
      }
      done();
    });
  });

  // CHAT
  socket.on("send-message", (message) => {
    messageQueue.enQueue((done) => {
      const currentSocket = Players[socket.id];
      const room = currentSocket.room;
      console.log("sender: ", currentSocket.socket.id, "message: ", message);
      if (currentSocket.oponent) {
        // using the current socket here cause i want it to reflect only for the reciever socket
        currentSocket.socket
          .to(room)
          .emit("message-recieved", { message: message });
      }
      // signal event done processing
      done();
    });
  });
});

function matchPlayers(firstPlayerID, secondPlayerID) {
  const room = firstPlayerID + secondPlayerID;

  Players[firstPlayerID] = {
    ...Players[firstPlayerID],

    room: room,
    mark: "X",
    oponent: secondPlayerID,
  };

  Players[secondPlayerID] = {
    ...Players[secondPlayerID],

    room: room,
    mark: "O",
    oponent: firstPlayerID,
  };

  Players[firstPlayerID].socket.join(room);
  Players[secondPlayerID].socket.join(room);

  // set data to be sent to matched clients
  let playerArray = [
    {
      socketID: Players[firstPlayerID].socket.id,
      userID: Players[firstPlayerID].userID,
      avatar: Players[firstPlayerID].avatar,
      gametag: Players[firstPlayerID].gametag,
      mark: Players[firstPlayerID].mark,
      // initiallized
      score: 0,
    },
    {
      socketID: Players[secondPlayerID].socket.id,
      userID: Players[secondPlayerID].userID,
      avatar: Players[secondPlayerID].avatar,
      gametag: Players[secondPlayerID].gametag,
      mark: Players[secondPlayerID].mark,
      // initiallized
      score: 0,
    },
  ];

  let first = Math.random() < 0.5 ? "X" : "O";

  io.to(room).emit("game-found", {
    found: true,
    first: first,
    players: playerArray,
    loadingMessage: "match found",
  });
}

// synchronizes events by queueing them(process each at a time)
function createQueue() {
  let queue = [];
  let processing = false;

  let processNext = () => {
    if (processing || queue.length === 0) return; // if still processing wait or nothing to be processed stop
    const nextEvent = queue.shift();

    processing = true;
    nextEvent(() => {
      processing = false;
      processNext();
    });
  };

  let enQueue = (item) => {
    queue.push(item);
    if (typeof item == "function") {
      processNext();
    }
  };

  let dequeue = () => {
    return queue.shift();
  };

  let peek = () => {
    return queue[0];
  };

  let size = () => {
    return queue.length;
  };
  let isEmpty = () => {
    return queue.length === 0;
  };

  let remove = (item) => {
    queue = queue.filter((i) => i !== item);
  };

  return { enQueue, dequeue, peek, size, isEmpty, remove };
}

app.use("/static", express.static(path.resolve(__dirname, "public", "static")));

app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log("\nserver running: http://localhost:" + PORT + "\n");
});
