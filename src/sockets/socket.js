// src/sockets/socket.js
import { io } from "socket.io-client";

const socket = io("https://auction-4k8p.onrender.com", {
  transports: ["websocket"], // Force WebSocket to avoid CORS
  withCredentials: true,
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Socket disconnected:", reason);
});

export default socket;