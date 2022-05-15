export const generateNamespace = (length = 6) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const exportPlayers = (players) => {
  players.forEach((player) => {
    delete player.socketID;
  });

  return players;
};
