const express=require("express");
const db = require("./db");
const login = require("./login");
const app=express();
const PORT=process.env.PORT || 5000;
app.use(express.json());

function formatEvent(row) {
    return {
        id: String(row.id),
        title: row.title,
        start: row.start_time.toISOString(),
        end: row.end_time.toISOString(),
        description: row.descr || "",
        eventType: row.event_type
    };
}

async function verifyCoach(body) {
    const { teamId, firstName, lastName, role } = body || {};
    if (
        typeof teamId !== "string" ||
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        role !== "coach"
    ) {
        return false;
    }

    const coach = await login.checkLogin(teamId, firstName, lastName, role);
    return coach.valid && coach.isCoach;
}

app.get("/api/events", async(req,res)=>{
    try {
        const result = await db.query(
            `SELECT id, title, event_type, start_time, end_time, descr
             FROM events
             ORDER BY start_time ASC`
        );
        res.json(result.rows.map(formatEvent));
    }
    catch(error) {
        console.error(error);
        res.status(500).json({error: "Team events are unavailable. Please try again."});
    }
});

app.post("/api/events", async(req,res)=>{
    try {
        const {
            teamId,
            firstName,
            lastName,
            role,
            title,
            eventType,
            start,
            end,
            description
        } = req.body || {};

        const requiredStrings = [teamId, firstName, lastName, title, eventType, start, end];
        if (
            requiredStrings.some((value) => typeof value !== "string" || !value.trim()) ||
            role !== "coach" ||
            !["practice", "game", "meeting", "travel", "other"].includes(eventType) ||
            title.trim().length > 355 ||
            (typeof description === "string" && description.trim().length > 255)
        ) {
            return res.status(400).json({error: "Enter valid event details within the allowed length limits."});
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            endDate <= startDate
        ) {
            return res.status(400).json({error: "The event end time must be after its start time."});
        }

        if (!(await verifyCoach(req.body))) {
            return res.status(403).json({error: "Only verified coaches can create team events."});
        }

        const result = await db.query(
            `INSERT INTO events (title, event_type, start_time, end_time, descr)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, title, event_type, start_time, end_time, descr`,
            [
                title.trim(),
                eventType,
                startDate.toISOString(),
                endDate.toISOString(),
                typeof description === "string" && description.trim() ? description.trim() : null
            ]
        );
        res.status(201).json(formatEvent(result.rows[0]));
    }
    catch(error) {
        console.error(error);
        res.status(500).json({error: "The event could not be created. Please try again."});
    }
});

app.patch("/api/events/:id", async(req,res)=>{
    try {
        const { title, eventType, start, end, description } = req.body || {};
        if (
            !(await verifyCoach(req.body)) ||
            typeof title !== "string" ||
            typeof eventType !== "string" ||
            typeof start !== "string" ||
            typeof end !== "string" ||
            !title.trim() ||
            !start.trim() ||
            !end.trim() ||
            !["practice", "game", "meeting", "travel", "other"].includes(eventType) ||
            title.trim().length > 355 ||
            (typeof description === "string" && description.trim().length > 255)
        ) {
            return res.status(400).json({error: "Enter valid event details within the allowed length limits."});
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
            return res.status(400).json({error: "The event end time must be after its start time."});
        }

        const eventId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({error: "The event ID is invalid."});
        }

        const result = await db.query(
            `UPDATE events
             SET title = $1, event_type = $2, start_time = $3, end_time = $4, descr = $5
             WHERE id = $6
             RETURNING id, title, event_type, start_time, end_time, descr`,
            [
                title.trim(),
                eventType,
                startDate.toISOString(),
                endDate.toISOString(),
                typeof description === "string" && description.trim() ? description.trim() : null,
                eventId
            ]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({error: "Event not found."});
        }
        res.json(formatEvent(result.rows[0]));
    }
    catch(error) {
        console.error(error);
        res.status(500).json({error: "The event could not be updated. Please try again."});
    }
});

app.delete("/api/events/:id", async(req,res)=>{
    try {
        if (!(await verifyCoach(req.body))) {
            return res.status(403).json({error: "Only verified coaches can delete team events."});
        }

        const eventId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(eventId)) {
            return res.status(400).json({error: "The event ID is invalid."});
        }

        const result = await db.query("DELETE FROM events WHERE id = $1", [eventId]);
        if (result.rowCount === 0) {
            return res.status(404).json({error: "Event not found."});
        }
        res.status(204).send();
    }
    catch(error) {
        console.error(error);
        res.status(500).json({error: "The event could not be deleted. Please try again."});
    }
});


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
        if(result.valid && !result.registered) {
            await login.updateRegistration(result.user.teamId);
            result.registered = true;
        }
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