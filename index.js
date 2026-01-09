import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';
import userRoutes from './routes/user.route.js';
dotenv.config({});

const  app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
    origin: 'http://localhost:5173', // Adjust this to your frontend's origin
    credentials: true,
};
app.use(cors(corsOptions));
const PORT = process.env.PORT || 3000;

app.use('/api/v1/users', userRoutes);

app.listen(PORT, ()=>{
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})