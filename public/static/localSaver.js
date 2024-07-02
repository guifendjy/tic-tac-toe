function User() {
  let userData;
  Object.defineProperty(this, "data", {
    get: () => userData,
    set: ({ gametag, avatar, userID }) =>
      (userData = { gametag, avatar, userID }),
  });
}
// get users from ls
function getUsers() {
  // retrieving existing profiles to render(do on page load)
  const profilesData = JSON.parse(localStorage.getItem("profilesData"));
  return profilesData;
}

function getUserData({ userID }) {
  let profiles = getUsers();
  const index = profiles.findIndex((obj) => obj.userID == userID);
  if (index != -1) {
    return profiles[index];
  }
}
function createUserProfile({ gametag, avatar, userID }) {
  // creating and saving userProfile
  // could later implement the avatar(by giving option to leave game and go back to index);
  const profile = JSON.parse(localStorage.getItem("profilesData")) || [];
  let userData = { gametag, avatar, userID };
  let newUser = new User();
  newUser.data = userData;
  profile.push(newUser.data);
  // store updated arr
  localStorage.profilesData = JSON.stringify(profile);
}

function deleteUserProfile({ userID }) {
  let profiles = getUsers();
  let newProfiles = [...profiles];
  const index = newProfiles.findIndex((obj) => obj.userID == userID);
  if (index != -1) {
    newProfiles.splice(index, 1);
    // replace whole data arr inside ls
    localStorage.profilesData = JSON.stringify(newProfiles);
  }
}

function updateUserProfile({ gametag, avatar, userID }) {
  let profiles = getUsers();
  let newProfiles = [...profiles];
  const index = newProfiles.findIndex((obj) => obj.userID == userID);
  // updates arr(replace userdata by new data)
  newProfiles[index] = { gametag, avatar, userID };
  // replace whole data arr inside ls
  localStorage.profilesData = JSON.stringify(newProfiles);
}

export {
  getUsers,
  getUserData,
  createUserProfile,
  deleteUserProfile,
  updateUserProfile,
};
