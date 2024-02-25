import express from "express";
import db from "../utils/connect-mysql.js"; // 資料庫

const router = express.Router();

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

router.get("/", async (req, res) => {
  const output = await getRoomList(req);
  res.json(output);
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
  try {
    const [result] = await db.query(sql, [
      room_name,
      room_password,
      user_id,
      category_id,
    ]);
    const room_id = result.insertId;

    output.room_id = room_id;
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }
  res.json(output);
});

export default router;
