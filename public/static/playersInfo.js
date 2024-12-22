import { getState } from "./state.js";

// gameview component || Board subComponent
export function PlayerInfoComponent(playersArray) {
  console.log(playersArray);
  let container = document.createElement("div");
  container.style = `
      width: 100%;
      display: flex;
      background-color: rgb(104, 28, 196);
      padding: .5em 1.2em;
      border-radius: 10px;
      justify-content: space-between;
  `;
  if (playersArray && playersArray.length == 2) {
    const APP_STATE = getState();
    let player =
      playersArray &&
      playersArray.find((player) => player.userID === APP_STATE?.userID);

    let oponent =
      playersArray &&
      playersArray.find((player) => player.userID !== APP_STATE?.userID);

    console.log("player: ", player?.userID);
    console.log("oponent: ", oponent?.userID);

    [player, oponent].forEach((player, index) => {
      let playerIF = document.createElement("div");
      playerIF.className = "player-info";
      playerIF.innerHTML = `
                        <img src="static/assets/${
                          player.avatar
                        }.jpeg" alt="avatar" style="width: 50px;height:50px"/>
                        <p class="gametag" style="font-size: .89rem; color: white;">${
                          player.gametag
                        }</p>
                        <p class="score" style="font-size: .7rem; color: yellow; font-weight: 700;">score: ${
                          player.score
                        }</p>
                        ${
                          index == 0
                            ? `<p class="mark" style="font-size: .69rem; color: yellow; font-weight: 700; white-space:nowrap;">you're playing as ${player.mark}</p>`
                            : ""
                        }`;
      container.appendChild(playerIF);
    });
  } else
    container.innerHTML = `<p style="color: red; font-size:1.2rem;">error loading players data</p>`;
  return container;
}
