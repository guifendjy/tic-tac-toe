// COMPONENTS
// loading component
export function loadingComponent(content) {
  let load = document.createElement("div");
  load.style = `
    display: grid;
    place-items: center;`;
  let message = document.createElement("p");
  message.textContent = content ? content : "";
  message.className = "loading-message";
  message.style = `
    color: white;
    font-size: .7rem;
    white-space: nowrap;
    `;

  load.id = "loading";
  let innerLoad = document.createElement("div");
  innerLoad.id = "inner-loading";

  load.append(message, innerLoad);
  return load;
}
