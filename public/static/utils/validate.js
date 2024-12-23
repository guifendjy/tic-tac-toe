// VALIDATE DATA
import * as localStore from "./localSaver.js";

export function validate(appstate) {
  console.log(appstate);
  let error;

  // returns false if value is falsy(using it without the new keyword it doesn't work)
  switch (appstate.currentView) {
    case "landingview":
      if (!appstate.avatar || !appstate.gametag) {
        error = { valid: false, message: "avatar or username required " };
      } else {
        error = { valid: true };
      }
      break;
    case "choosegamemode":
      if (appstate.gameMode == "ai") {
        if (!appstate.gameMode || !appstate.options) {
          error = {
            valid: false,
            message: "mark or difficulty level required",
          };
        } else {
          error = { valid: true };
        }
      } else {
        error = { valid: true };
      }
      break;
    default:
      error = { valid: false, message: "something wrong occured" };
  }
  return error;
}

// localSaving functionnalities
function saveUserProfile(data) {
  localStore.createUserProfile(data);
}
