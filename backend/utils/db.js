import mongoose from 'mongoose';

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to database successfully");
    }catch(error){
        console.error("Error connecting to database", error);
    }
}


export default connectDB;