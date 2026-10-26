// Anything with "roster" has to be re coded into our roster however I don't know how to access that from here
const db = require("./db");

async function checkLogin(teamId, firstName, lastName, role) {
    // Gets the roster member from the table
    const result = await db.query(
        `SELECT team_id, first_name, last_name, role, position, registered
         FROM roster_members
         WHERE UPPER(team_id) = UPPER($1)
           AND LOWER(first_name) = LOWER($2)
           AND LOWER(last_name) = LOWER($3)
           AND role = $4
         LIMIT 1`,
        [teamId.trim(), firstName.trim(), lastName.trim(), role]
    );
    //Stores those records into array
   const member = result.rows[0];

    if (!member) {
        return {
            valid: false,
            isPlayer: false,
            isCoach: false
        };
    }

    return {
        valid: true,
        isPlayer: member.role === "player",
        isCoach: member.role === "coach",
        user: {
            teamId: member.team_id,
            firstName: member.first_name,
            lastName: member.last_name,
            role: member.role,
            position: member.position
        },
        registered: member.registered
    };
}

async function updateRegistration(teamId) {
    const result = await db.query(
        "UPDATE roster_members SET registered = TRUE WHERE team_id = $1 AND registered = FALSE",
        [teamId]
    );
    return result.rowCount; //just a check to know whether the database update worked
}

module.exports = {
    checkLogin,
    updateRegistration
};
