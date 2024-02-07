// 引入express
import express from "express";
import cors from "cors";
import upload from "./utils/upload-imgs.js"; // 上傳圖片
import db from "./utils/connect-mysql.js"; // 資料庫
import testRouter from "./routes/index.js"; // 引入路由

//建立web server物件
const app = express();

// top-level middlewares // 依檔頭Content-Type來決定是否解析
app.use(cors()); // 放所有路由的前面
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 定義路由
app.get("/", (req, res) => {
  res.send("<h2>abc</h2>");
});

app.use("/test", testRouter); // 當成 middleware 使用

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

app.listen(port, () => {
  console.log(`express server ${port}`);
});
