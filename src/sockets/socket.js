import { io } from "socket.io-client";

const socket = io("https://auction-tn7o.onrender.com");

export default socket;