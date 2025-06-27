const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
require("dotenv").config();

const PORT = process.env.PORT;
const accountApi = require("./apiService/accountApi");
const authApi = require("./apiService/authApi");
const authenticateToken = require("./apiService/authMiddleware");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(express.static("./"));
app.use(compression());

// Auth endpoints
app.post("/api/register", authApi.register);
app.post("/api/login", authApi.login);

//Jobs endpoints
app.post("/api/post-jobs", accountApi.postJobs);
app.get("/api/jobs", accountApi.getJobs);

//Bookmarks endpoints
app.post("/api/post-bookmarks", authenticateToken, accountApi.bookmarkJob);
app.get("/api/bookmarks", authenticateToken, accountApi.getBookmarks);
app.delete("/api/bookmarks", authenticateToken, accountApi.deleteBookmark);

//Sg Address endpoints
app.post("/api/save-sg-address", authenticateToken, accountApi.saveSgAddress);
app.get("/api/get-sg-address", authenticateToken, accountApi.getSgAddress);

//Personal particulars endpoints
app.post("/api/save-personal-particulars", authenticateToken, accountApi.savePersonalParticulars);
app.get("/api/get-personal-particulars", authenticateToken, accountApi.getPersonalParticulars);

//Overseas Address endpoints
app.post("/api/save-overseas-address", authenticateToken, accountApi.saveOverseasAddress);
app.get("/api/get-overseas-address", authenticateToken, accountApi.getOverseasAddress);

//Military Service endpoints
app.post("/api/save-military-service", authenticateToken, accountApi.saveMilitaryService);
app.get("/api/get-military-service", authenticateToken, accountApi.getMilitaryService);

//Education endpoints
app.post("/api/save-education", authenticateToken, accountApi.saveEducationBackground);
app.get("/api/get-education", authenticateToken, accountApi.getEducationBackground);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


// // Sample/test
// app.get("/api/test", accountapi.testFunc);
// app.get("/api/test2", accountapi.testSelect);


