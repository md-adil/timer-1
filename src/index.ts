import { easeInOut, timer } from ".";
export * from "./engine";

const [start, stop] = timer(() => {
  console.log("hello");
}, easeInOut(10, 10));

console.time();
start();
setTimeout(() => {
  stop();
  console.timeLog();
}, 950);
