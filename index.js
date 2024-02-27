// 引入express
import express from "express";
import cors from "cors";
import upload from "./utils/upload-imgs.js"; // 上傳圖片
import db from "./utils/connect-mysql.js"; // 資料庫
import testRouter from "./routes/index.js"; // 引入路由
import roomRouter from "./routes/room.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createServer } from "http";

//建立web server物件
const app = express();

// top-level middlewares // 依檔頭Content-Type來決定是否解析
app.use(cors()); // 放所有路由的前面
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

const chatRooms = {};
//socket.io;
io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on("join_room", (room_id, userName) => {
    socket.join(room_id);
    if (!chatRooms[room_id]) {
      chatRooms[room_id] = [];
    }

    // 向当前房间内的其他用户广播用户加入的消息
    socket.to(room_id).emit("user_joined", userName);
  });

  socket.on("leave_room", (room_id, userName) => {
    socket.leave(room_id);
    io.to(room_id).emit("user_left", userName);

    console.log("123");
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on("chat_message", (data) => {
    const { room_id, message, senderId, userName, userImage } = data;
    chatRooms[room_id].push({ message, senderId, userName, userImage });
    io.to(room_id).emit("chat_message", {
      message,
      senderId,
      userName,
      userImage,
    }); // 將消息廣播到房間中
  });
});

// 定義路由
app.get("/", (req, res) => {
  res.send("<h2>abc</h2>");
});

// 註冊api
app.post("/api/regist", async (req, res) => {
  const output = {
    success: false,
    postData: req.body, // 除錯用
  };
  const { user_name, account, password, user_img } = req.body.formData;
  const hash = await bcrypt.hash(password, 8);
  const sql = `INSERT INTO user( user_name, account, password,user_img) VALUES (?,?,?,?)`;
  try {
    const [result] = await db.query(sql, [user_name, account, hash, user_img]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }
  res.json(output);
});

// 登入api
app.post("/api/login", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    postData: req.body,
    token: "",
  };
  const { account, password } = req.body;
  if (!account || !password) {
    // 資料不足
    output.code = 410;
    return res.json(output);
  }
  const sql = "SELECT * FROM user WHERE account=?";
  const [rows] = await db.query(sql, [account]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 400;
    return res.json(output);
  }
  const row = rows[0];
  const pass = await bcrypt.compare(password, row.password);
  if (!pass) {
    // 密碼是錯的
    output.code = 420;
    return res.json(output);
  }
  output.code = 200;
  output.success = true;
  output.user_name = row.user_name;
  output.user_id = row.user_id;
  output.token = jwt.sign({ user_name: row.user_name }, process.env.JWT_SECRET);

  res.json(output);
});

// 切換圖片
app.put("/change-img", async (req, res) => {
  const user_id = +req.query.user_id;
  const user_img = req.query.user_img;
  const output = {
    success: false,
  };
  const sql = "UPDATE `user` SET `user_img`=? WHERE user_id = ?";
  const [result] = await db.query(sql, [user_img, user_id]);
  output.success = !!result.changedRows;
  res.json(output);
});

app.use("/test", testRouter); // 當成 middleware 使用
app.use("/room", roomRouter);

// 上傳圖片的路由
// 加入 middleware upload.single()
// app.post("/try-upload", upload.single("avatar"), (req, res) => {
//   res.json(req.file);
// });

// app.post("/try-uploads", upload.array("photos"), (req, res) => {
//   res.json(req.files);
// });

// 設定靜態內容的資料夾 // public裡面的內容相當於在根目錄
app.use(express.static("public"));

const port = process.env.WEB_PORT || 3001; // 如果沒設定就使用3001

server.listen(port, () => {
  console.log(`express server ${port}`);
});
