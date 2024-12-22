// RENDERS THE container
import { loadingComponent } from "../loading.js";
import { error } from "../error.js";
// syncronous render
let renderView = (container, view) => {
  // render new view by removing old view
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(view);
};

// asyncronous render
export function render(
  container,
  view,
  callBack,
  loadingMessage = "",
  condition = true
) {
  // promise the view
  let currentView = new Promise((resolve, reject) => {
    setTimeout(() => {
      let v = view();
      if (v) {
        resolve(v);
      } else {
        reject(new Error("view failed to load"));
      }
    }, Math.floor(Math.random() * 1000));
  });

  // render loading state while resolving
  renderView(container, loadingComponent(loadingMessage));
  // resolved then render view(if condition is true)
  if (condition)
    currentView
      .then((view) => {
        renderView(container, view);
        if (callBack && typeof callBack == "function") {
          callBack(...arguments);
        }
      })
      .catch((e) => {
        console.log(e);
        APP_STATE.errors = { message: "error occured" };
        renderView(container, error());
      });
}
