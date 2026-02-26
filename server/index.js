require("dotenv").config();

const createApp = require("./app");
const router = require("./routes");

const PORT = process.env.PORT;
const app = createApp();

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


