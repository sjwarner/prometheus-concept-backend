import { buildPlayers } from "../utilities/utilities.js";

export default class PrometheusConceptGame {
  constructor(players, gameSocket) {
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

      socket.on("playerMovedPiece", (gameState) => {
        const nextPlayer = this.players[this.currentPlayer === 0 ? 1 : 0].name;

        this.players.map((player) => {
          const playerSocket = this.gameSocket.sockets.get(player.socketID);

          playerSocket.emit("updateGameState", gameState);
          playerSocket.emit("updatePlayerTurn", nextPlayer);
        });

        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
      });

      socket.on("playerWon", (gameState) => {
        const winningPlayer = this.players[this.currentPlayer].name;

        this.players.map((player) => {
          const playerSocket = this.gameSocket.sockets.get(player.socketID);

          playerSocket.emit("updateGameState", gameState);
          playerSocket.emit("updatePlayerWon", winningPlayer);
        });
      });

      socket.on("requestRematch", (username) => {
        const playerIndex = this.players.findIndex(
          (player) => player.name === username
        );
        this.players[playerIndex].wantsRematch = true;

        // If everyone wants a rematch, reset the game
        // Else, send messages to other player telling them about rematch request
        if (this.players.every((player) => player.wantsRematch === true)) {
          console.log("Everyone did it, so resetGame");
          this.players.map((player) => {
            // As game has been reset, clear player's rematch flag
            player.wantsRematch = false;

            const playerSocket = this.gameSocket.sockets.get(player.socketID);
            playerSocket.emit("resetGame");
          });
        } else {
          console.log("Just one person, so opponentRequested");
          this.players
            .filter((player) => !player.wantsRematch)
            .map((player) => {
              const playerSocket = this.gameSocket.sockets.get(player.socketID);
              playerSocket.emit("opponentRequestedRematch");
            });
        }
      });
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
