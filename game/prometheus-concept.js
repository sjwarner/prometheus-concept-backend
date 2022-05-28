import { buildNameSocketMap, buildNameIndexMap, buildPlayers, exportPlayers } from "../utilities/utilities.js";
import Players from "../utilities/Players.js";

export default class PrometheusConceptGame {
  constructor(players, gameSocket) {
    this.nameSocketMap = buildNameSocketMap(players);
    this.nameIndexMap = buildNameIndexMap(players);
    this.players = buildPlayers(players);
    this.gameSocket = gameSocket;
    this.currentPlayer = 0;
    // this.deck = gameUtils.buildDeck();
    // this.actions = constants.Actions;
    // this.isChallengeBlockOpen = false; // if listening for challenge or block votes
    // this.isRevealOpen = false; // if listening for what influence player will reveal
    // this.isChooseInfluenceOpen = false; // if listening for what influence to lose
    // this.isExchangeOpen = false; // if listening for result of ambassador exchange;
    // this.votes = 0;
  }

  resetGame = (startingPlayer = 0) => {
    this.currentPlayer = startingPlayer;

    // this.aliveCount = this.players.length;

    // this.isChallengeBlockOpen = false;
    // this.isRevealOpen = false;
    // this.isChooseInfluenceOpen = false;
    // this.isExchangeOpen = false;

    // this.votes = 0;
    // this.deck = gameUtils.buildDeck();
    // for (let i = 0; i < this.players.length; i++) {
    //   this.players[i].money = 2;
    //   this.players[i].influences = [this.deck.pop(), this.deck.pop()];
    //   this.players[i].isDead = false;
    // }
  }

  listen() {
    this.players.map(player => {
      const socket = this.gameSocket.sockets.get(player.socketID);
      let bind = this;
      socket.on("g-playAgain", () => {
        if (bind.isPlayAgainOpen) {
          bind.isPlayAgainOpen = false;
          this.resetGame(Math.floor(Math.random() * this.players.length));
          this.updatePlayers();
          this.playTurn();
        }
      });

      socket.on("playerSetSphere", (playerNumber, gameState) => {
        console.log("player sphere set for ", playerNumber)
        console.log("game state is ", gameState)

        const nextPlayer = playerNumber === Players.PLAYER_ONE ? Players.PLAYER_TWO : Players.PLAYER_ONE;
        console.log("next player is ", nextPlayer)

        socket.emit("updateGameState", gameState)
        socket.emit("updatePlayerTurn", nextPlayer)

        console.log("emitted new events")
      })

      // Might be best analogue to a move
      /**
       * @typedef {Object} res - Response object
       * @property {String} influence - The influence name
       * @property {String} playerName - The player's name
       */
      socket.on("g-chooseInfluenceDecision", (res) => {
        console.log(211, res);
        // res.influence, res.playerName
        const playerIndex = bind.nameIndexMap[res.playerName];
        if (bind.isChooseInfluenceOpen) {
          bind.gameSocket.emit(
            "g-addLog",
            `${res.playerName} lost their ${res.influence}`
          );
          for (
            let i = 0;
            i < bind.players[playerIndex].influences.length;
            i++
          ) {
            if (bind.players[playerIndex].influences[i] === res.influence) {
              bind.players[playerIndex].influences.splice(i, 1);
              break;
            }
          }
          bind.isChooseInfluenceOpen = false;
          bind.nextTurn();
        }
      });
    });
  }

  updatePlayers() {
    // when players die
    this.gameSocket.emit("g-updatePlayers", exportPlayers(JSON.parse(JSON.stringify(this.players))));
  }

  //
  // applyAction(action) {
  //   console.log(this.players);
  //   console.log(action);
  //   let logTarget = "";
  //
  //   if (action.target) {
  //     logTarget = ` on ${action.target}`;
  //   }
  //   this.gameSocket.emit(
  //     "g-addLog",
  //     `${action.source} used ${action.action}${logTarget}`
  //   );
  //   const execute = action.action;
  //   const target = action.target;
  //   const source = action.source;
  //   if (execute === "income") {
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === source) {
  //         this.players[i].money += 1;
  //         break;
  //       }
  //     }
  //     this.nextTurn();
  //   } else if (execute === "foreign_aid") {
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === source) {
  //         this.players[i].money += 2;
  //         break;
  //       }
  //     }
  //     this.nextTurn();
  //   } else if (execute === "coup") {
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === target) {
  //         this.isChooseInfluenceOpen = true;
  //         this.gameSocket
  //           .to(this.nameSocketMap[target])
  //           .emit("g-chooseInfluence");
  //         break;
  //       }
  //     }
  //     // no nextTurn() because it is called in "on chooseInfluenceDecision"
  //   } else if (execute === "tax") {
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === source) {
  //         this.players[i].money += 3;
  //         break;
  //       }
  //     }
  //     this.nextTurn();
  //   } else if (execute === "assassinate") {
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === target) {
  //         this.isChooseInfluenceOpen = true;
  //         this.gameSocket
  //           .to(this.nameSocketMap[target])
  //           .emit("g-chooseInfluence");
  //         break;
  //       }
  //     }
  //     // no nextTurn() because it is called in "on chooseInfluenceDecision"
  //   } else if (execute === "exchange") {
  //     const drawTwo = [this.deck.pop(), this.deck.pop()];
  //     this.isExchangeOpen = true;
  //     this.gameSocket
  //       .to(this.nameSocketMap[source])
  //       .emit("g-openExchange", drawTwo);
  //     // no nextTurn() because it is called in "on chooseExchangeDecision"
  //   } else if (execute === "steal") {
  //     let stolen = 0;
  //     for (let i = 0; i < this.players.length; i++) {
  //       console.log(348, this.players[i].name, target);
  //       if (this.players[i].name === target) {
  //         if (this.players[i].money >= 2) {
  //           this.players[i].money -= 2;
  //           stolen = 2;
  //         } else if (this.players[i].money === 1) {
  //           this.players[i].money -= 1;
  //           stolen = 1;
  //         } else {
  //           //no money stolen
  //         }
  //         break;
  //       }
  //     }
  //     for (let i = 0; i < this.players.length; i++) {
  //       if (this.players[i].name === source) {
  //         this.players[i].money += stolen;
  //         break;
  //       }
  //     }
  //     this.nextTurn();
  //   } else {
  //     console.log("ERROR ACTION NOT FOUND");
  //   }
  // }
  //
  // nextTurn() {
  //   console.log(
  //     !this.isChallengeBlockOpen,
  //     !this.isChooseInfluenceOpen,
  //     !this.isExchangeOpen,
  //     !this.isRevealOpen
  //   );
  //   if (
  //     !this.isChallengeBlockOpen &&
  //     !this.isChooseInfluenceOpen &&
  //     !this.isExchangeOpen &&
  //     !this.isRevealOpen
  //   ) {
  //     this.players.forEach((x) => {
  //       console.log(x.influences);
  //       if (x.influences.length === 0 && !x.isDead) {
  //         // player is dead
  //         this.gameSocket.emit("g-addLog", `${x.name} is out!`);
  //         this.aliveCount -= 1;
  //         x.isDead = true;
  //         x.money = 0;
  //       }
  //     });
  //     this.updatePlayers();
  //     if (this.aliveCount === 1) {
  //       let winner = null;
  //       for (let i = 0; i < this.players.length; i++) {
  //         if (this.players[i].influences.length > 0) {
  //           winner = this.players[i].name;
  //         }
  //       }
  //       this.isPlayAgainOpen = true;
  //       this.gameSocket.emit("g-gameOver", winner);
  //       //GAME END
  //     } else {
  //       do {
  //         this.currentPlayer += 1;
  //         this.currentPlayer %= this.players.length;
  //       } while (this.players[this.currentPlayer].isDead === true);
  //       this.playTurn();
  //     }
  //   }
  // }
  //

  playTurn() {
    this.gameSocket.emit("updatePlayerTurn", this.players[this.currentPlayer].name);
    console.log(this.players[this.currentPlayer].socketID);

    this.gameSocket.to(this.players[this.currentPlayer].socketID).emit("g-makeMove");
  }

  start = () => {
    this.resetGame();
    this.listen();
    this.updatePlayers();
    console.log("Game has started");
    this.playTurn();
  }
}
