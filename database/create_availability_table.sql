CREATE TABLE IF NOT EXISTS event_availability(
    event_id INTEGER NOT NULL,
    player_id VARCHAR(8) NOT NULL,
    status VARCHAR(11) NOT NULL,
    PRIMARY KEY (event_id, player_id),
    FOREIGN KEY (event_id) 
        REFERENCES events(id)
        ON DELETE CASCADE,
    FOREIGN KEY (player_id)
        REFERENCES roster_members(team_id),
    CHECK (status IN ('available', 'unavailable')) 
);