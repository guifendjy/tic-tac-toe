import { getState } from "./state.js";

import { formatDate } from "./utils/dateFormatter.js";

// chat component
export function Chat(button, socket = null, playersInfos = null) {
  let chatContainer = document.createElement("div");
  chatContainer.className = "Chat hide";
  chatContainer.style = `
                    display: flex;
                    justify-content: space-between;
                    flex-wrap: column-wrap;
                    flex-direction: column;
                    padding: .5em;
                    background-color: white;
                    width: 100%;
                    height: 500px;
                    min-height: 80%;
                    margin-top: 1.2em;
    `;

  let fragment = document.createDocumentFragment();

  // top side of chat(display recipient)
  let topOfChat = document.createElement("div");
  topOfChat.style = `
            padding: .5em;
            text-align:center;
            border-bottom: 1px solid gray;
    `;
  let chatTitle = document.createElement("h1");
  chatTitle.style.color = "gray";
  // set name of receiver

  const oponent =
    playersInfos &&
    playersInfos.find((player) => player.socketID !== socket.id);

  chatTitle.textContent = (oponent && oponent.gametag) || "(oponent name)";
  // will create something to close chat(or minimize)
  topOfChat.append(chatTitle);

  // all the messages will be displayed here
  //(will dynamiclly add it here when everything is done being rendered)
  // with init() when game is initialized
  let messageList = document.createElement("div");
  messageList.id = "message-list";
  messageList.style = `
                    display: flex;
                    flex-direction: column;
                    gap: .6em;
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
    `;

  // input to send messge
  let messageFormContainer = document.createElement("div");
  messageFormContainer.style = `
                          display:flex;
                          align-items: flex-end;
                          gap: .5em;
                          border-top: 1px solid gray;
                          padding: .5em;
    `;
  let msgInput = document.createElement("textarea");
  msgInput.className = "message-input";
  msgInput.placeholder = "type a message...";
  msgInput.style = `
    width: 100%;
    height: 40px;
    padding: .3em;
    outline: none;
    border: 1px solid gray;
    border-radius: 5px;
    font-size: 1rem;
    max-height: 200px;
    resize: none; // disable manual resizing
  // might need pollyfills for brwsr support
                    `;

  msgInput.addEventListener("keyup", (e) => {
    const target = e.target;
    target.style.height = "40px";
    let newHeight = target.scrollHeight;
    target.style.height = `${newHeight}px`;
  });

  let msgSubmitButton = document.createElement("div");
  msgSubmitButton.className = "send-btn";

  // msgSubmitButton.className = "btn";
  msgSubmitButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;

  // on send-btn pres
  msgSubmitButton.onclick = () => {
    if (msgInput.value.trim() != "") {
      const APP_STATE = getState();
      // append message as sender(set side to right else left)
      appendMessage(APP_STATE?.avatar, "right", msgInput.value, messageList);
      socket.emit("send-message", msgInput.value);
    }
    msgInput.value = "";
    msgInput.style.height = "50px";
  };

  socket.on("message-recieved", (data) => {
    console.log("recieved", data.message);
    // notify new message
    if (!button.classList.contains("on")) {
      button.classList.add("new-message");
    }
    appendMessage(oponent?.avatar, "left", data.message, messageList);
  });

  messageFormContainer.append(msgInput, msgSubmitButton);

  fragment.append(topOfChat, messageList, messageFormContainer);
  chatContainer.appendChild(fragment);
  return chatContainer;
}

// chat component -> inner component(messages)
function appendMessage(avatar, side, message, container) {
  //   Simple solution for small apps
  const msgHTML = `
      <div class="msg ${side}">
      <!-- avatar possibly might not make it to final product 
      -->
      <img class="chat-avatar" src="static/assets/${avatar}.jpeg" alt="${avatar}">
      <!-- message content and time -->
        <div class="msg-bubble">
            <p class="msg-content">${message}</p>
            <p class="msg-time">${formatDate(new Date())}</p>
        </div>
      </div>
    `;

  container.insertAdjacentHTML("beforeend", msgHTML);
  container.scrollTop += 500;
}
