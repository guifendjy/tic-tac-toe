import { profiles } from "./profiles.js";
import { getState, updateSTATE } from "./state.js";

import {
  createUserProfile as saveUserProfile,
  getUsers,
  deleteUserProfile as deleteProfile,
} from "./utils/localSaver.js";

const avatars = ["anime", "vampire", "assassin"];

// landingview component
// VIEW 1
export function landingView() {
  // landing page container
  let AvatarContainer = document.createElement("div");
  AvatarContainer.classList.add("content-container");

  let fragment = document.createDocumentFragment();

  // profiles saved profiles in ls renders if there's at least one
  // . circled avatar with name inside(append before h2)
  let userProfiles = profiles();
  let h1 = document.createElement("h1");
  h1.textContent = "PROFILES";
  h1.style = `
    color: yellow;
    margin-bottom: -20px;
    font-weight: 800;`;

  if (userProfiles) {
    fragment.append(h1, userProfiles);
  }

  // h2
  let h2 = document.createElement("h2");
  h2.textContent = "Choose An Avatar";
  h2.style.color = "white";
  fragment.appendChild(h2);

  // dynamiclly rendered imgs
  let imgContainer = document.createElement("div");
  imgContainer.classList.add("img-container");
  avatars.forEach((name) => {
    let avatarImg = document.createElement("img");
    avatarImg.src = `static/assets/${name}.jpeg`;
    avatarImg.id = name;
    avatarImg.alt = name;

    avatarImg.classList.add("avatar");
    imgContainer.appendChild(avatarImg);
  });
  fragment.appendChild(imgContainer);

  // select an avatar

  imgContainer.onclick = (e) => selectAvatar(e);

  AvatarContainer.appendChild(fragment);

  return AvatarContainer;
}

// landingview component
function inputs() {
  let div = document.createElement("div");
  div.id = "inputs-container";

  div.style = `
  width: 60%;
  display: flex;
  flex-direction: column;
  justify-content:center;
  align-item: center;
  gap: .6em;`;

  let gameTagInput = document.createElement("input");
  gameTagInput.placeholder = "enter username";
  gameTagInput.style = `
                    padding: .3em;
                    border:none;
                    border-bottom: 1px solid yellow;
                    outline: none;
                    background: none;
                    color: white;
                    `;

  gameTagInput.onchange = (e) => {
    const value = e.target.value;

    // updates gameTagInput
    let gametag = value;
    let userID = getState().gametag + Date.now();

    updateSTATE((prev) => ({ ...prev, gametag, userID }));
    console.log("gametag: ", gametag, "userID: ", userID);
  };

  let saveContainer = document.createElement("div");
  saveContainer.style = `
  text-align: center;
  display: flex;
  flex-direction:center;
  justify-content:center;
  gap: .3em;
  color: white;
  `;

  let save = document.createElement("input");
  save.type = "checkbox";
  save.id = "save-user";

  save.onchange = (e) => {
    updateSTATE((prev) => ({ ...prev, save: e.target.value }));
  };

  let label = document.createElement("label");
  label.textContent = "save this user";
  label.htmlFor = "save-user";
  label.style = `
  font-size: .7rem`;

  saveContainer.append(save, label);

  // button
  let Next = document.createElement("button");
  Next.className = "btn";
  Next.textContent = "Next";

  Next.onclick = () => {
    if (gameTagInput.value != "") {
      const users = getUsers();
      const appstate = getState();

      if (users && users.some((user) => user.gametag == appstate.gametag)) {
        updateSTATE((prev) => ({ ...prev, error: "user already exist..." }));
        return;
      }

      if (appstate.save) {
        saveUserProfile({
          avatar: appstate.avatar,
          gametag: appstate.gametag,
          userID: appstate.userID,
        });
        console.log("will be saved");
      }
      updateSTATE((prev) => ({ ...prev, error: null }));
    }
  };

  Next.setAttribute("data-navigate", "/gamemode");

  // add to div
  div.append(gameTagInput, saveContainer, Next);
  // render on page
  return div;
}

// onclick event to select avatar(from landingview view)
function selectAvatar(e) {
  const target = e.target;
  let parentELements = Array.from(target.parentNode.childNodes);
  if (target.matches("img")) {
    if (parentELements.some((el) => el.classList.contains("active"))) {
      parentELements.forEach((el) => el.classList.remove("active"));
      document.getElementById("inputs-container").remove();
    }
    target.classList.add("active");
    let showGametagInput = e.target.classList.contains("active");

    if (showGametagInput) {
      let div = inputs(); // this keeps creating duplicates
      target.parentNode.parentNode.insertBefore(
        div,
        target.parentNode.nextSibling
      );
    }
    // save the person's avatar here(use localstorage use the functions from mathmind to manipulate LS)
    console.log(e.target.id);
    // update avatar
    updateSTATE((prev) => ({ ...prev, avatar: e.target.id }));
  }
}
