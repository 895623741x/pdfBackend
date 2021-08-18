const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;
app.use(cors());

app.use(express.static("public"));

app.use(function (req, res, next) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.setHeader("Access-Control-Allow-Methods", "GET, POST");
   res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, Authorization");
   next();
});

var list = "";
const { exec } = require("child_process");
const { stdout, stderr } = require("process");
const outputFileName = "output.pdf";

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "public");
   },
   filename: (req, file, cb) => {
      cb(null, file.originalname);
   },
});

// const imageFilter = (req, file, cb) => {
//    if (file.mimeType == "image/png" || file.mimeType == "image/jpg" || file.mimeType == "image/jpeg") {
//       cb(null.true);
//    } else {
//       cb(null, false);
//       return cb(new Error("only .jpg, .png, .jpeg formats are allowed"));
//    }
// };

const upload = multer({ storage }).array("file");

app.get("/", (req, res) => {
   res.send("hello!");
});

app.post("/upload", (req, res) => {
   upload(req, res, (err) => {
      if (err) {
         return res.status(500).json(err);
      }

      return res.status(200).send(req.files);
   });
});

app.post("/merge", upload, (req, res) => {
   list = "";
   if (req.files) {
      req.files.forEach((file) => {
         list += `${file.path}`;
         list += " ";
      });

      console.log(list);

      exec(`magick convert ${list} ${outputFileName}`, (err, stderr, stdout) => {
         if (err) throw err;

         res.download(outputFileName, (err) => {
            if (err) throw err;
         });

         req.files.forEach((file) => {
            fs.unlinkSync(file.path);
         });
      });
   }
});

app.get("/download", (req, res) => {
   var file = path.join(__dirname, "output.pdf");

   fs.readFile(file, (err, data) => {
      res.contentType("application/pdf");
      res.send(data);
   });

   fs.unlinkSync(outputFileName);
});

app.listen(process.env.PORT || 8000, () => {
   console.log("app is running at port 8000");
});
