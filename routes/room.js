import express from "express";
import db from "../utils/connect-mysql.js"; // 資料庫
// import { Server } from "socket.io";
// import { createServer } from "http";

const router = express.Router();
// const httpServer = createServer();

// // 建立 WebSocket 服務
// const io = new Server(httpServer);

// // 將房間與其對應的 WebSocket 連接儲存在物件中
// const roomSockets = {};

// 取得房間資料的函式
const getRoomList = async (req) => {
  let rows = [];
  let output = {
    success: false,
  };
  const sql = `SELECT 
  r.* ,
  u.user_name,
  c.category_name,
  c.image FROM room r
  JOIN user u ON r.user_id = u.user_id
  LEFT JOIN category c ON r.category_id = c.category_id
  ORDER BY r.room_id desc`;

  [rows] = await db.query(sql);
  output = { ...output, success: true, rows };
  return output;
};

// 取得所有房間資料
router.get("/", async (req, res) => {
  const output = await getRoomList(req);
  res.json(output);
});

// 取得單一房間資料
router.get("/chatroom/:rid", async (req, res) => {
  const rid = req.params.rid;

  // // 確保房間尚未建立 WebSocket 連接
  // if (!roomSockets[rid]) {
  //   // 建立新的 WebSocket 連接
  //   roomSockets[rid] = io
  //     .of(`/room/chatroom/${rid}`)
  //     .on("connection", (socket) => {
  //       console.log(`User connected to room ${rid}`);

  //       // 當收到新的聊天訊息時
  //       socket.on("chat_message", (message) => {
  //         // 將訊息廣播到該聊天室的所有用戶
  //         roomSockets[rid].emit("chat_message", message);
  //       });

  //       // 當用戶斷開連接時處理
  //       socket.on("disconnect", () => {
  //         console.log(`User disconnected from room ${rid}`);
  //       });
  //     });
  // }
  const sql = `SELECT 
  u.user_name,
  u.user_img,
  rm.level,
  r.room_name,
  c.category_name 
  FROM room_member rm
  JOIN user u ON rm.user_id = u.user_id
  JOIN room r ON rm.room_id = r.room_id
  JOIN category c ON r.category_id = c.category_id
  WHERE rm.room_id = ?`;
  const [rows] = await db.query(sql, [rid]);
  res.json(rows);
});

// 創建房間
router.post("/create-room", async (req, res) => {
  const output = {
    success: false,
    body: req.body,
  };
  const { room_name, room_password, user_id, category_id } =
    req.body.createRoomForm;

  const sql =
    "INSERT INTO `room`( `room_name`, `room_password`, `user_id`, `category_id`) VALUES (?,?,?,?)";
  const sql2 =
    "INSERT INTO `room_member`( `room_id`, `user_id`, `level`) VALUES (?,?,?)";
  const level = "admin";
  try {
    const [result] = await db.query(sql, [
      room_name,
      room_password,
      user_id,
      category_id,
    ]);
    const room_id = result.insertId; // 取得建立的room_id

    const [result2] = await db.query(sql2, [room_id, user_id, level]);

    output.room_id = room_id;
    output.result = result;
    output.result2 = result2;

    output.success = !!result.affectedRows && !!result2.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }

  res.json(output);
});

export default router;
