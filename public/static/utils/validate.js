// VALIDATE DATA
import * as localStore from "./localSaver.js";

export function validate(appstate) {
  let error;
  // returns false if value is falsy(using it without the new keyword it doesn't work)
  switch (appstate.currentView) {
    case "landingview":
      if (!appstate.avatar || !appstate.gametag) {
        error = { valid: false, message: "avatar or username required " };
      } else {
        // on validate true save userData(prevent from saving same user twice)
        let users = localStore.getUsers();
        if (users && users.some((user) => user.userID == appstate.userID))
          return;
        saveUserProfile({
          avatar: appstate.avatar,
          gametag: appstate.gametag,
          userID: appstate.userID,
        });
      }
      break;
    case "choosegamemode":
      if (appstate.gameMode == "ai") {
        if (!appstate.gameMode || !appstate.options) {
          error = {
            valid: false,
            message: "mark or difficulty level required",
          };
        }
      }
      break;
    default:
      error = { valid: false, message: "something wrong occured" };
  }
  if (!error) return { valid: true };
  else return error;
}

// localSaving functionnalities
function saveUserProfile(data) {
  localStore.createUserProfile(data);
}
