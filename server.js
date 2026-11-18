require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const EventEmitter = require("events");

const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");
const { authenticateToken, authorizeRoles } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // For production, replace "*" with your frontend origin.
});
const appEvents = new EventEmitter();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Secure Connect Communication Platform API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// Protected sample route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: { id: req.user._id, username: req.user.username, email: req.user.email, role: req.user.role }
  });
});

// RBAC example: only admin users can access this route
app.get("/api/admin", authenticateToken, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Welcome, administrator" });
});

// EventEmitter: application-level event and listener
appEvents.on("chatMessage", ({ username, message, room }) => {
  console.log(`[${room}] ${username}: ${message}`);
});
appEvents.on("userConnected", username => {
  console.log(`User connected: ${username}`);
});

// Authenticate Socket.IO connections using the same JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid or expired socket token"));
  }
});

io.on("connection", socket => {
  const username = socket.user.id;
  appEvents.emit("userConnected", username);

  socket.on("joinRoom", roomName => {
    const room = String(roomName || "general").trim().slice(0, 50);
    socket.join(room);
    socket.emit("joinedRoom", { room, message: `Joined ${room}` });
  });

  socket.on("chatMessage", data => {
    const room = String(data?.room || "general").trim().slice(0, 50);
    const message = String(data?.message || "").trim().slice(0, 1000);
    if (!message) return;

    const payload = { username, message, room, sentAt: new Date().toISOString() };
    appEvents.emit("chatMessage", payload);
    io.to(room).emit("newMessage", payload);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${username}`);
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGO_URI and JWT_SECRET must be set in .env");
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully");
  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

startServer().catch(error => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});
