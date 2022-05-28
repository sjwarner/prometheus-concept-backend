import express from "express";
import cors from "cors";

import { createServer } from "http";
import { Server } from "socket.io";

import { generateNamespace } from "./utilities/utilities.js";
import PrometheusConceptGame from "./game/prometheus-concept.js";

// Server/express setup
const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {});

const PORT = 8000;

let namespaces = {}; // Party rooms

app.get("/createNamespace", (req, res) => {
  let newNamespace = "";
  while (newNamespace === "" || newNamespace in namespaces) {
    newNamespace = generateNamespace(); //default length 6
  }

  const newSocket = io.of(`/${newNamespace}`);
  openSocket(newSocket, `/${newNamespace}`);
  namespaces[newNamespace] = null;
  res.json({ namespace: newNamespace });
});

app.get("/exists/:namespace", (req, res) => {
  const namespace = req.params.namespace;
  res.json({ exists: namespace in namespaces });
});

// game namespace: oneRoom
const openSocket = (gameSocket, namespace) => {
  let players = []; // includes deleted players
  let partyMembers = []; // active members
  let partyLeader = "";
  let started = false;

  gameSocket.on("connection", (socket) => {
    console.log("id: " + socket.id);

    players.push({
      player: "",
      socket_id: `${socket.id}`,
      isReady: false,
    });
    console.log(`player ${players.length} has connected`);

    socket.join(socket.id);
    console.log("socket joined " + socket.id);
    const index = players.length - 1;

    const updatePartyList = () => {
      partyMembers = players
        .map((x) => {
          return { name: x.player, socketID: x.socket_id, isReady: x.isReady };
        })
        .filter((x) => x.name !== "");
      console.log(partyMembers);
      gameSocket.emit("partyUpdate", partyMembers);
    };

    socket.on("setName", (name) => {
      // when client joins, it will immediately set its name
      console.log(started);
      if (started) {
        gameSocket
          .to(players[index].socket_id)
          .emit("joinFailed", "game_already_started");
        return;
      }
      if (!players.map((x) => x.player).includes(name)) {
        if (partyMembers.length > 2) {
          gameSocket
            .to(players[index].socket_id)
            .emit("joinFailed", "party_full");
        } else {
          if (partyMembers.length === 0) {
            partyLeader = players[index].socket_id;
            players[index].isReady = true;
            gameSocket.to(players[index].socket_id).emit("leader");
            console.log("PARTY LEADER IS: " + partyLeader);
          }
          players[index].player = name;
          console.log(players[index]);
          updatePartyList();
          gameSocket
            .to(players[index].socket_id)
            .emit("joinSuccess", players[index].socket_id);
        }
      } else {
        gameSocket
          .to(players[index].socket_id)
          .emit("joinFailed", "name_taken");
      }
    });

    socket.on("setReady", (isReady) => {
      // When player pressed ready up, this event is emitted
      console.log(`${players[index].player} is ready`);
      players[index].isReady = isReady;
      updatePartyList();
      gameSocket.to(players[index].socket_id).emit("readyConfirm");
    });

    socket.on("startGameSignal", (players) => {
      started = true;
      gameSocket.emit("startGame");
      startGame(players, gameSocket, namespace);
    });

    socket.on("disconnect", () => {
      console.log("disconnected: " + socket.id);
      players.map((player, index) => {
        if (player.socket_id === socket.id) {
          gameSocket.emit(
            "g-addLog",
            `${JSON.stringify(players[index].player)} has disconnected`
          );
          gameSocket.emit("g-addLog", "Please recreate the game.");
          gameSocket.emit("g-addLog", "Sorry for the inconvenience (シ_ _)シ");
          players[index].player = "";
          if (socket.id === partyLeader) {
            gameSocket.emit("leaderDisconnect", "leader_disconnected");
            socket.removeAllListeners();
            delete io._nsps[namespace];
            delete namespaces[namespace.substring(1)];
            players = [];
            partyMembers = [];
          }
        }
      });
      updatePartyList();
    });
  });

  // let checkEmptyInterval = setInterval(() => {
  //   if (Object.keys(gameSocket["sockets"]).length === 0) {
  //     delete io.nsps[namespace];
  //     if (namespaces[namespace] != null) {
  //       delete namespaces[namespace.substring(1)];
  //     }
  //     clearInterval(checkEmptyInterval);
  //     console.log(namespace + "deleted");
  //   }
  // }, 10000);
};

const startGame = (players, gameSocket, namespace) => {
  namespaces[namespace.substring(1)] = new PrometheusConceptGame(
    players,
    gameSocket
  );
  namespaces[namespace.substring(1)].start();
};

server.listen(process.env.PORT || PORT, function () {
  console.log(`listening on ${process.env.PORT || PORT}`);
});
