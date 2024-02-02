// Import necessary modules
// const express = require("express");
// const bodyParser = require("body-parser");
// const route = require("./routes/route.js");
// const mongoose = require("mongoose");
//require('dotenv').config(); // Make sure to load environment variables

//import express from "express";
//import route from './routes/user.routes.js'
// rest of your code
//const app = express();

import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { app } from "./app.js";

app.use(bodyParser.json());
dotenv.config({
  path: './env',
});
 
const uri =
  "mongodb+srv://16039233:16039233@hariom-semwal.ylnslae.mongodb.net/backend-code ";

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });
//wdhewhdhwohowdh
//app.use("./", route);

app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000));
});
