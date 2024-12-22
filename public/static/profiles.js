import { getState, updateSTATE } from "./state.js";

import * as localStore from "./utils/localSaver.js";

export function profiles() {
  // grab all saved profiles from local storage and append to an list of profiles
  // limits profiles to 5
  let profileContainer = document.createElement("div");

  profileContainer.className = "profile-container";
  profileContainer.style = `display: flex;
                              background-color:  rgb(104, 28, 196);
                              max-width: 400px;
                              gap: 1.2em;
                              overflow-x: scroll;
                              overflow-y: hidden;
                              white-space: nowrap;
                              cursor: pointer;
                              border-radius: 20px;
                              padding: .5em 2em`;

  let allUsers = localStore.getUsers();
  console.log(allUsers);

  allUsers &&
    allUsers.forEach((user) => {
      let div = document.createElement("div");
      div.style = `text-align: center;`;
      div.id = `${user.userID}`;
      div.innerHTML = `
          <img style="width: 60px; height: 60px; border-radius: 50%" src="static/assets/${user.avatar}.jpeg" alt="avatar"/>
          <p style="color: yellow; font-size: .78rem;">${user.gametag}</p>
      `;
      profileContainer.append(div);
    });
  profileContainer.onclick = (e) => {
    const target = e.target;
    if (target.matches("img") || target.matches("p")) {
      const ID = target.parentNode.id;
      let data = localStore.getUserData({ userID: ID });
      const APP_STATE = getState();

      updateSTATE({
        ...APP_STATE,
        avatar: data.avatar,
        gametag: data.gametag,
        userID: data.userID,
      });

      target.setAttribute("data-navigate", "/gamemode");
      console.log(target);
    }
  };
  return allUsers ? profileContainer : null;
}
