// APP STATE
// app state gotta be saved in session or local(app loses state on refresh)
// and update when needed with this managers functions
export let APP_STATE = {
  state: {
    userID: null,
    gametag: "",
    avatar: "",
    gameMode: "",
    options: null,
    error: null,
    currentView: "",
    gameScore: {
      player: 0,
      ai: 0,
    },
    save: false,
  },
};

export function getState() {
  return APP_STATE.state;
}
export function updateSTATE(newState) {
  APP_STATE.state =
    typeof newState == "function" ? newState(APP_STATE.state) : newState;
}
