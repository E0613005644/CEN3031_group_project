const express=require("express");
const db = require("./db");
const login = require("./login");
const app=express();
const PORT=process.env.PORT || 5000;
app.use(express.json());


app.post("/api/roster/verify", async(req,res)=>{
    try{
        const { teamId, firstName, lastName, role } = req.body || {};
        const fields = [teamId, firstName, lastName];
        if (
            fields.some((value) => typeof value !== "string" || !value.trim()) ||
            !["player", "coach"].includes(role)
        ) {
            return res.status(400).json({ error: "Enter a team ID, first name, last name, and valid role." });
        }

        const result=await login.checkLogin(teamId, firstName, lastName, role);
        res.json(result);
    }
    catch(error){
        console.error(error);
        res.status(500).json({error: "Identity verification is unavailable. Please try again."});
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