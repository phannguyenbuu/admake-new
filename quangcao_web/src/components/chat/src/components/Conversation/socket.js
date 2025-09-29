// src/socket.js
import { io } from "socket.io-client";

const URL = process.env.REACT_APP_API_URL || "https://archbox.pw";
export const socket = io(URL, {
  path: "/socket.io",
  autoConnect:false,
  transports:['websocket'],
});


