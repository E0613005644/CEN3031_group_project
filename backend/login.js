// Anything with "roster" has to be re coded into our roster however I don't know how to access that from here
const db=require("./db")
async function checkLogin(team_id, first_name, last_name, role) {
    
    if (!team_id || !first_name || !last_name || !role) {
        return {
            valid: false,
            isPlayer: false,
            isCoach: false
        };
    }

    // Gets all the roster members from the table
    const result= await db.query("SELECT * FROM roster_members");
    //Stores those records into array
    const roster=result.rows;
    // Looks for player in roster
    const user = roster.find(member => member.team_id === team_id && member.first_name===first_name && member.last_name === last_name && member.role===role);
    if (!user) {
        return {
            valid: false,
            isPlayer: false,
            isCoach: false
        };
    }
    let isPlayer = false;
    let isCoach = false;

    if (user.role === "player") {
        isPlayer = true;
    }
    else if (user.role === "coach") {
        isCoach = true;
    }

    return {
        valid: true,
        isPlayer: isPlayer,
        isCoach: isCoach,
        user: user,
        registered:user.registered
    };
}

async function updateRegistration(team_id){
    const result=await db.query("UPDATE roster_members SET registered=TRUE WHERE team_id=$1 AND registered=FALSE", [team_id]);
    return result.rowCount; //just a check to know whether the database update worked
}

module.exports = {
    checkLogin,
    updateRegistration
};
