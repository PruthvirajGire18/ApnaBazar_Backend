import mongoose from "mongoose";
import { updateCart } from "../controllers/cartController.js";
import authUser from "../middlewares/authUser.js";
import express from "express";
const cartRouter=express.Router();
cartRouter.post("/update",authUser,updateCart);
export default cartRouter;