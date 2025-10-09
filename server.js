import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './configs/db.js';
import "dotenv/config";
import userRouter from './routes/userRoute.js';
const app = express();
const PORT=process.env.PORT || 5000;
await connectDB();
// Allow Multiple Origins
const allowedOrigins = ['http://localhost:5173'];
// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/user', userRouter);
app.use('/api/user', userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
