import { getState, updateSTATE } from "./state.js";

// VIEW 2
export function chooseGameMode() {
  let container = document.createElement("div");
  container.classList.add("content-container");

  let fragment = document.createDocumentFragment();
  let h2 = fragment.appendChild(document.createElement("h2"));
  h2.textContent = "Chose game Mode";
  h2.style.color = "white";

  // modes options
  let modeContainer = fragment.appendChild(document.createElement("div"));
  modeContainer.id = "mode-container";
  modeContainer.style = "display:flex; gap: 2em";

  // select mode (using event delegation)
  // ai
  let aiCard = ModeCard("ai");
  let multiplayerCard = ModeCard("multiplayer");

  // contains current options for active mode
  let aiOP = aiOptions();
  let multiplayerOP = multiplayerOptions();

  fragment.append(aiOP, multiplayerOP);
  modeContainer.onclick = (e) => selectMode(e, { aiOP, multiplayerOP });

  modeContainer.append(aiCard, multiplayerCard);

  container.appendChild(fragment);
  return container;
}

// choseGameMode component
const ModeCard = (mode) => {
  let title = document.createElement("h1");
  title.style.color = "white";
  title.textContent = `${mode.toUpperCase()}`;
  let img = document.createElement("img");
  img.classList.add("avatar");
  img.id = mode;
  img.src = `static/assets/${mode}.gif`;
  img.alt = mode;

  let div = document.createElement("div");
  div.style = `display:flex; 
                flex-direction: column;
                justify-items:center;
                align-items:center;
                gap: 1em;
                `;

  div.append(title, img);
  return div;
};

// ai options
function aiOptions() {
  let div = document.createElement("div");
  div.id = "ai-op";
  div.className = "hide";
  div.style = `
    display: flex;
    flex-direction: column;
    gap: 1em;
    width: 60%;
    `;

  let fieldset = document.createElement("fieldset");
  fieldset.style = `
    display: flex;
    gap:1em;
    justify-content: center;
    align-items: center;
    padding: .5em;
    border: 1px solid white;
    border-radius: 5px;
    color: white;
  `;

  fieldset.innerHTML = `
    <legend>Choose Mark</legend>
    <label class="radio-label"><input type="radio" id="O" value="O" name="mark"/>circle</label>
    <label class="radio-label"><input type="radio" id="X" value="X" name="mark"/>cross</label>
    `;
  fieldset.onclick = (e) => {
    let target = e.target;
    if (target.matches("input[name=mark]:checked")) {
      const prevState = getState();

      updateSTATE({
        ...prevState,
        options: { ...prevState.options, mark: target.value },
      });
    }
  };

  let select = document.createElement("select");
  select.name = "difficulty";
  select.id = "difficulty-select";
  select.style = `
    font-size: .8rem;
    color: rgb(104, 28, 196);
    padding:.5rem;
    outline: none;
    border:1px solid white;
    border-radius: 5px;
    `;
  select.innerHTML = `
    <option value="">--choose difficulty level</option>
    <option value="easy">easy</option>
    <option value="medium">medium</option>
    <option value="hard">hard</option>
    `;
  select.onchange = (e) => {
    let target = e.target;
    const prevState = getState();

    updateSTATE({
      ...prevState,
      options: { ...prevState.options, difficulty: target.value },
    });
  };

  // Play AI
  const Play = document.createElement("button");
  Play.className = "btn";
  Play.textContent = "start";
  Play.setAttribute("data-navigate", "/play/ai");
  div.append(fieldset, select, Play);
  return div;
}
// multiplayer option
function multiplayerOptions() {
  // add id params in route handling for finding and creategame options
  let div = document.createElement("div");
  div.id = "multiplayer-op";
  div.className = "hide";
  div.style = `
    display: flex;
    flex-direction: column;
    gap: 1em;
    width: 60%;
  `;

  // each button will have an :id param
  const findAMatch = document.createElement("button");
  findAMatch.className = "btn";
  findAMatch.textContent = "find a match";
  findAMatch.setAttribute("data-navigate", "/play/multiplayer");

  div.append(findAMatch);
  return div;
}

// onclick event to select mode(from choseGameMode view)
function selectMode(e, modeOptionContainer = {}) {
  const target = e.target;
  let parentELements = Array.from(target.parentNode.parentNode.childNodes);
  let mergedElements = parentELements
    .map((el) => Array.from(el.childNodes))
    .flat();
  if (target.matches("img")) {
    // switch gamemode
    if (mergedElements.some((el) => el.classList.contains("active"))) {
      mergedElements.forEach((el) => el.classList.remove("active"));
    }
    // sets gameMode
    // updates gamemode
    updateSTATE({ ...getState(), gameMode: target.id });

    target.classList.add("active");
    let { aiOP, multiplayerOP } = modeOptionContainer;
    if (target.id == "ai") {
      aiOP.classList.remove("hide");
      multiplayerOP.classList.add("hide");
    }
    if (target.id == "multiplayer") {
      multiplayerOP.classList.remove("hide");
      aiOP.classList.add("hide");
    }
  }
}
