# Lab 4: Secure Connect and Communication Platform

A Node.js + Express backend implementing signup/login, bcrypt password hashing, JWT authentication, protected routes, role-based access control, a user-owned Notes CRUD API, Socket.IO chat, EventEmitter events, and dotenv configuration.

## 1. Requirements
- Node.js (LTS)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- Postman
- VS Code (recommended)

## 2. Setup
1. Extract the project ZIP and open this folder in VS Code.
2. Open a terminal in this folder and run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.
4. In `.env`, set a long random `JWT_SECRET`. Keep `.env` private.
5. Start MongoDB locally, if using the local connection string.
6. Run:
   ```bash
   npm run dev
   ```
   or `npm start`.

Server: `http://localhost:5000`

## 3. Test in Postman

Use `http://localhost:5000` as the base URL. Select **Body → raw → JSON**.

### Signup
`POST /api/auth/signup`
```json
{
  "username": "victor",
  "email": "victor@example.com",
  "password": "123456"
}
```
Expected: `201 Created`, with message, user id, username and email.

### Login
`POST /api/auth/login`
```json
{
  "email": "victor@example.com",
  "password": "123456"
}
```
Expected: `200 OK` and a JWT token. Copy the token.

### Protected profile
`GET /api/profile`

Header:
`Authorization: Bearer YOUR_TOKEN`

Expected: `200 OK` and the user's profile. Without a token, expect `401`.

### Create a note
`POST /api/notes`

Header: `Authorization: Bearer YOUR_TOKEN`

JSON body:
```json
{
  "title": "My First Note",
  "content": "This is my first note of Web Dev III."
}
```
Expected: `201 Created` and the saved note.

### Read notes
`GET /api/notes`

Header: `Authorization: Bearer YOUR_TOKEN`

Expected: `200 OK` with only the logged-in user's notes.

### Update a note
`PUT /api/notes/NOTE_ID`

Header: `Authorization: Bearer YOUR_TOKEN`

JSON body:
```json
{
  "title": "Updated Note",
  "content": "Updated note content."
}
```

### Delete a note
`DELETE /api/notes/NOTE_ID`

Header: `Authorization: Bearer YOUR_TOKEN`

### Admin-only route (RBAC)
`GET /api/admin`

Header: `Authorization: Bearer ADMIN_TOKEN`

New accounts receive the `user` role by default. For a lab demonstration, change one test user's `role` to `admin` in MongoDB Compass, then log in again and use the newly issued token. Normal users receive `403 Forbidden`.

## 4. Real-time chat test

Install the Socket.IO client in a separate test folder or use a small Node client:
```bash
npm install socket.io-client
```

Create `client.js`:
```js
const { io } = require("socket.io-client");

const token = "PASTE_LOGIN_TOKEN_HERE";
const socket = io("http://localhost:5000", { auth: { token } });

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("joinRoom", "general");
  socket.emit("chatMessage", {
    room: "general",
    message: "Hello, real-time chat!"
  });
});

socket.on("joinedRoom", data => console.log(data));
socket.on("newMessage", data => console.log("New message:", data));
socket.on("connect_error", error => console.log("Connection error:", error.message));
```
Run `node client.js` in two terminals with valid login tokens to see messages broadcast to the `general` room. The server console also logs chat events through Node's EventEmitter.

## 5. API summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | Verify credentials and issue JWT |
| GET | `/api/profile` | Protected profile |
| GET | `/api/admin` | Admin-only RBAC example |
| GET | `/api/notes` | List own notes |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update own note |
| DELETE | `/api/notes/:id` | Delete own note |

## 6. Important notes
- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- JWT is sent in the `Authorization: Bearer <token>` header for HTTP routes.
- Socket.IO also checks a JWT during the connection handshake.
- Each note is linked to its owner; users cannot read, update or delete another user's notes.
- Signup does not accept a role from the client, preventing users from registering themselves as admins.
- In production, use HTTPS, restrict CORS to your frontend domain, validate inputs more extensively, and keep secrets out of source control.
