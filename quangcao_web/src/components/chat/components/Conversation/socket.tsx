// src/socket.js
import { io } from "socket.io-client";
import { useApiHost, useApiSocket } from "../../../../common/hooks/useApiHost";

const URL = useApiSocket() || "https://archbox.pw";
export const socket = io(URL, {
  path: "/socket.io",
  autoConnect:false,
  transports:['websocket'],
});


