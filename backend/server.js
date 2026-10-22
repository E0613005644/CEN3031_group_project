const express=require("express");
const db = require("./db");
const login = require("./login");
const app=express();
const PORT=5000;
app.use(express.json());


app.post("/api/roster/verify", async(req,res)=>{
    try{
        const id=req.body.teamId;
        const first=req.body.firstName
        const last=req.body.lastName;
        const role=req.body.role
        const result=await login.checkLogin(id, first,last, role);
        res.json(result);
    }
    catch(error){
        console.error(error);
        res.status(500).json({error: "verification failed"});
    }
});


app.listen(PORT, ()=> {
    console.log(`server is running on port ${PORT}`);
});

/*
My references for this setup are below:
https://expressjs.com/en/starter/hello-world/
https://fullcalendar.io/docs/event-parsing
*/