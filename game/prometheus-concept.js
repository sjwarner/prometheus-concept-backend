import {
  buildNameIndexMap,
  buildPlayers,
} from "../utilities/utilities.js";

export default class PrometheusConceptGame {
  constructor(players, gameSocket) {
    this.nameIndexMap = buildNameIndexMap(players);
    this.players = buildPlayers(players);
    this.gameSocket = gameSocket;
    this.currentPlayer = 0;
  }

  resetGame = (startingPlayer = 0) => {
    this.currentPlayer = startingPlayer;
  };

  listen() {
    this.players.map((player) => {
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

      socket.on("playerMovedPiece", gameState => {
        const nextPlayer = this.players[this.currentPlayer === 0 ? 1 : 0].name;

        this.players.map((player) => {
          const playerSocket = this.gameSocket.sockets.get(player.socketID);

          playerSocket.emit("updateGameState", gameState);
          playerSocket.emit("updatePlayerTurn", nextPlayer);
        });

        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
      })
    });
  }

  playTurn() {
    this.gameSocket.emit(
      "updatePlayerTurn",
      this.players[this.currentPlayer].name
    );
    console.log(this.players[this.currentPlayer].socketID);

    this.gameSocket
      .to(this.players[this.currentPlayer].socketID)
      .emit("g-makeMove");
  }

  start = () => {
    this.resetGame();
    this.listen();
    console.log("Game has started");
    this.playTurn();
  };
}
