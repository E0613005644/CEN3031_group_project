const express=require("express");
const app=express();
const PORT=5000;
app.use(express.json());

app.get("/api/events", (req,res)=>{ /* this is just a sample event to test if the backend can send event data to calender API */
    const events=[
        {
            id:"1",
            title:"Practice",
            start:"2026-10-15T13:00:00",
            end:"2026-10-15T16:00:00",
            extendedProps:{ /* FullCalender uses extendedProps when there is extra information to store*/
                event_type:"practice",
                descr:"there will be a mandatory team practice held on October 15"
            }
        }
    ];
    res.json(events);  /* sends information back to frontend*/
});
app.listen(PORT, ()=> {
    console.log(`server is running on port ${PORT}`);
});

/*
My references for this setup are below:
https://expressjs.com/en/starter/hello-world/
https://fullcalendar.io/docs/event-parsing
*/