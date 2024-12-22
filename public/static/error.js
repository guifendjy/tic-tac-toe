export function error(message) {
  let error = document.createElement("div");
  error.style = `
              position: absolute;
              top: 10%;
              left: 50%;
              transform: translate(-50%, -50%);
              max-width: 300px;
              width: 95%;
              max-height: 100px;
              background-color: white;
              border-radius: 5px;
              padding: .5em;
              color: red;
              text-align: center;
              font-size: 1rem;
    `;

  error.textContent = message;
  return error;
}
