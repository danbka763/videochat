// Подключаем библиотеки
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidv4 } = require("uuid");

// Промежуточный обработчик
app.use("/peerjs", peerServer);
app.use(express.static("public"));

// Шаблонизатор
app.set("view engine", "ejs");

// Парсер, чтоб получать данные с post запросов в req.body 
// например ключ комнаты на главной
const urlencodedParser = express.urlencoded({ extended: false });

// get запросы срабатывают при переходе на страницу
// например "/" - главная
app.get("/", (req, res) => {
  res.render("index");
}); 

app.get("/create_room", (req, res) => {
  res.redirect(`/room_${uuidv4()}`);
});

app.get("/room_:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// io.on "connection" - прослушка события присоединения к комнате
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    // Подключение пользователя к комнате
		socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

		// События отправки сообщения
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userId, userName);
    });

		// Событие выход пользователя из комнаты
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

// post запросы срабатывают при отправке form на сервер
// например клик по кнопке с передачей ключа комнаты на бек
app.post("/", urlencodedParser, (req, res) => {
  if (!req.body.roomId) {
    res.redirect("/create_room");
  } else {
    res.redirect(`/room_${req.body.roomId}`);
  }
});

// ищем прописанный в свойствах порт или ставим 5000
const PORT = process.env.PORT || 5000;

// Прослушиваем 5000 порт
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
