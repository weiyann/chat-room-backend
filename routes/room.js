import express from "express";
import db from "../utils/connect-mysql.js"; // 資料庫

const router = express.Router();

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

export default router;
