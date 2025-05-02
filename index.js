import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./utils/db.js";
import cookieParser from "cookie-parser";

// import all routes
import userRoutes from "./routes/user.routes.js";

// It look for the .env file in the root folder
dotenv.config();

const app = express();

// app.use() is used to add middleware to the Express application

// this code is used to allow cross-origin requests
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// It parses incoming JSON payloads(data) from HTTP request bodies, making the data available in req.body for your route handlers.
app.use(express.json());

// It parses incoming URL-encoded data from HTTP request bodies, making the data available in req.body for your route handlers
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/ks", (req, res) => {
  res.send("Learning Authentication");
});

// database connection
db();

// user routes
// whatever comes after /api/v1/users will be handled by userRoutes
app.use("/api/v1/users", userRoutes);

// Used to start a server, It tells your app to start listening for incoming requests (like from a browser or a client) on a specific port.
// port variable specifies which network port your Express server will listen on
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
