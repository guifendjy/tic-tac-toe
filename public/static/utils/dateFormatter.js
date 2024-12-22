// UTILS(format time)
export function formatDate(time) {
  let t = time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return t;
}
