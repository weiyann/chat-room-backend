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
    r.*,
    u.user_name,
    c.category_name,
    c.image,
    COUNT(rm.room_id) AS member_count
  FROM 
    room r
    JOIN user u ON r.user_id = u.user_id
    JOIN room_member rm ON r.room_id = rm.room_id
    LEFT JOIN category c ON r.category_id = c.category_id
  GROUP BY 
    r.room_id
  ORDER BY 
    r.room_id DESC;`;

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

// 進入房間
router.post("/enter-room", async (req, res) => {
  const output = {
    success: false,
    body: req.body,
  };

  const { room_id, user_id } = req.body;
  console.log(req.body);
  const level = "member";

  const sql =
    "INSERT INTO `room_member`( `room_id`, `user_id`, `level`) VALUES (?,?,?)";
  try {
    const [result] = await db.query(sql, [room_id, user_id, level]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }
  res.json(output);
});

// 離開房間
router.delete("/leave-room", async (req, res) => {
  const uid = +req.query.uid;
  console.log(uid);
  const output = {
    success: false,
  };
  const sql = "DELETE FROM `room_member` WHERE user_id = ?";
  const [result] = await db.query(sql, [uid]);
  output.result = result;
  output.success = !!result.affectedRows;

  res.json(output);
});

export default router;
