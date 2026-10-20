// Anything with "roster" has to be re coded into our roster however I don't know how to access that from here

function checkLogin(team_id, last_name) {
    
    if (!team_id || !last_name) {
        return {
            valid: false,
            isPlayer: false,
            isCoach: false
        };
    }

    // Looks for player in roster
    const user = roster.find(member => member.team_id === team_id && member.last_name === last_name);
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
        user: user
    };
}

module.exports = checkLogin;
