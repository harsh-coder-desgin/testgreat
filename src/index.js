// require('dotenv').config({path:'/env'})
import { app } from "./app.js"
// import cors from 'cors';










import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./.env'
}) 

// app.use(cors({
//   origin: 'https://aurcode.vercel.app', // or ['http://localhost:5173', 'https://your-frontend.vercel.app']
//   credentials: true, // only if using cookies
// }));

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is runing at port : ${process.env.PORT}`);
    })
    app.on("error",(error)=>{
            console.log("error",error);
            throw error
        })
})
.catch((err)=>{
    console.log("mongo db connection failed",err)
})


































// import express from "express"
// const app= express()

// ( async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("error",error);
//             throw error
//         })
        
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("error",error)
//         throw err
        
//     }
// })()