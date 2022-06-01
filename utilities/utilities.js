import Pieces from "../game/enums/Pieces.js";

export const generateNamespace = (length = 6) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const buildPlayers = (players) => {
  players.forEach((player) => {
    delete player.isReady;
    delete player.wantsRematch;
  });

  return players;
};

export const InitialRandomGameStateWhite = () => {
  let whiteTetrahedron = 8;
  let whitePyramid = 8;
  let whiteCube = 8;

  const gameState = Array.from({ length: 8 }, (_) => new Array(8).fill(""));

  let availablePieces = [
    [Pieces.WHITE_TETRAHEDRON, Pieces.BLACK_TETRAHEDRON],
    [Pieces.WHITE_PYRAMID, Pieces.BLACK_PYRAMID],
    [Pieces.WHITE_CUBE, Pieces.BLACK_CUBE],
  ];

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 8; y++) {
      const randomPiece =
        availablePieces[Math.floor(Math.random() * availablePieces.length)];
      gameState[7 - x][y] = randomPiece[0];
      gameState[x][y] = randomPiece[1];

      switch (randomPiece[0]) {
        case Pieces.WHITE_TETRAHEDRON:
          whiteTetrahedron--;
          if (whiteTetrahedron === 0) {
            availablePieces = availablePieces.filter(
              (piece) => piece.indexOf(Pieces.WHITE_TETRAHEDRON) === -1
            );
          }
          break;
        case Pieces.WHITE_PYRAMID:
          whitePyramid--;
          if (whitePyramid === 0) {
            availablePieces = availablePieces.filter(
              (piece) => piece.indexOf(Pieces.WHITE_PYRAMID) === -1
            );
          }
          break;
        case Pieces.WHITE_CUBE:
          whiteCube--;
          if (whiteCube === 0) {
            availablePieces = availablePieces.filter(
              (piece) => piece.indexOf(Pieces.WHITE_CUBE) === -1
            );
          }
          break;
        default:
          throw Error("Invalid piece");
      }
    }
  }

  return gameState;
};
