import {
  buildPlayers,
  InitialRandomGameStateWhite,
} from "../utilities/utilities.js";
import GameModes from "./enums/GameModes.js";

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

      socket.on("playerMovedPiece", (gameState) => {
        const nextPlayer = this.players[this.currentPlayer === 0 ? 1 : 0].name;
        const nextPlayerSocket = this.gameSocket.sockets.get(
          this.players[this.currentPlayer === 0 ? 1 : 0].socketID
        );
        nextPlayerSocket.emit("updateGameState", gameState);

        this.players.map((player) => {
          const playerSocket = this.gameSocket.sockets.get(player.socketID);
          playerSocket.emit("updatePlayerTurn", nextPlayer);
        });

        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
      });

      socket.on("playerWon", (gameState) => {
        const winningPlayer = this.players[this.currentPlayer].name;
        const losingPlayerSocket = this.gameSocket.sockets.get(
          this.players[this.currentPlayer === 0 ? 1 : 0].socketID
        );
        losingPlayerSocket.emit("updateGameState", gameState);

        this.players.map((player) => {
          const playerSocket = this.gameSocket.sockets.get(player.socketID);
          playerSocket.emit("updatePlayerWon", winningPlayer);
        });
      });

      socket.on("playerOfferedDraw", (offeringPlayerSocketId) => {
        const receivingPlayerSocketId = this.players.find(
          (player) => player.socketID !== offeringPlayerSocketId
        ).socketID;
        const receivingPlayerSocket = this.gameSocket.sockets.get(
          receivingPlayerSocketId
        );

        receivingPlayerSocket.emit("opponentOfferedDraw");
      });

      socket.on("playerWithdrewDrawOffer", (offeringPlayerSocketId) => {
        const receivingPlayerSocketId = this.players.find(
          (player) => player.socketID !== offeringPlayerSocketId
        ).socketID;
        const receivingPlayerSocket = this.gameSocket.sockets.get(
          receivingPlayerSocketId
        );

        receivingPlayerSocket.emit("opponentWithdrewDrawOffer");
      });

      socket.on("playerAcceptedDraw", (acceptingPlayerSocketId) => {
        const offeringPlayerSocketId = this.players.find(
          (player) => player.socketID !== acceptingPlayerSocketId
        ).socketID;
        const offeringPlayerSocket = this.gameSocket.sockets.get(
          offeringPlayerSocketId
        );

        offeringPlayerSocket.emit("opponentAcceptedDraw");
      });

      socket.on("playerDeclinedDraw", (decliningPlayerSocketId) => {
        const offeringPlayerSocketId = this.players.find(
          (player) => player.socketID !== decliningPlayerSocketId
        ).socketID;
        const offeringPlayerSocket = this.gameSocket.sockets.get(
          offeringPlayerSocketId
        );

        offeringPlayerSocket.emit("opponentDeclinedDraw");
      });

      socket.on("playerResigned", (resigningPlayerSocketId) => {
        const winningPlayerSocketId = this.players.find(
          (player) => player.socketID !== resigningPlayerSocketId
        ).socketID;
        const winningPlayerSocket = this.gameSocket.sockets.get(
          winningPlayerSocketId
        );

        winningPlayerSocket.emit("opponentResigned");
      });

      socket.on("requestRematch", (username, gameMode) => {
        const playerIndex = this.players.findIndex(
          (player) => player.name === username
        );
        this.players[playerIndex].wantsRematch = true;

        // Generate random state for random games - must be server side to ensure same layout for both players
        const gameState = InitialRandomGameStateWhite();

        // If everyone wants a rematch, reset the game
        // Else, send messages to other player telling them about rematch request
        if (this.players.every((player) => player.wantsRematch === true)) {
          this.resetGame(Math.floor(Math.random() * this.players.length));

          this.players.map((player) => {
            // As game has been reset, clear player's rematch flag
            player.wantsRematch = false;

            const playerSocket = this.gameSocket.sockets.get(player.socketID);

            if (gameMode === GameModes.ORIGINAL) {
              playerSocket.emit("resetGame", this.currentPlayer);
            } else {
              playerSocket.emit("resetGame", this.currentPlayer, gameState);
            }
          });
        } else {
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
  }

  start = () => {
    this.resetGame();
    this.listen();
    console.log("Game has started");
    this.playTurn();
  };
}
