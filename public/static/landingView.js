import { profiles } from "./profiles.js";
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
    imgContainer.appendChild( );
  });
  fragment.appendChild(imgContainer);

  // select an avatar

  imgContainer.onclick = (e) => selectAvatar(e);

  // button
  let Next = document.createElement("button");
  Next.className = "btn";
  Next.textContent = "Next";
  Next.setAttribute("data-navigate", "/gamemode");
  fragment.appendChild(Next);

  // render on page
  AvatarContainer.appendChild(fragment);
  return AvatarContainer;
}

// landingview component
function renderGameTagInput(container) {
  let gameTagInput = document.createElement("input");
  gameTagInput.id = "game-tag";
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
    console.log(e.target.value);
    // updates gameTagInput
    APP_STATE.gametag = e.target.value;
    APP_STATE.userID = APP_STATE.gametag + Date.now();
    console.log("gametag: ", APP_STATE.gametag, "userID: ", APP_STATE.userID);
  };

  container.insertAdjacentElement("afterend", gameTagInput);
}

// onclick event to select avatar(from landingview view)
function selectAvatar(e) {
  const target = e.target;
  let parentELements = Array.from(target.parentNode.childNodes);
  if (target.matches("img")) {
    if (parentELements.some((el) => el.classList.contains("active"))) {
      parentELements.forEach((el) => el.classList.remove("active"));
      document.getElementById("game-tag").remove();
    }
    target.classList.add("active");
    let showGametagInput = e.target.classList.contains("active");
    if (showGametagInput) {
      renderGameTagInput(target.parentNode);
    }
    // save the person's avatar here(use localstorage use the functions from mathmind to manipulate LS)
    console.log(e.target.id);
    // update avatar
    APP_STATE.avatar = e.target.id;
  }
}
