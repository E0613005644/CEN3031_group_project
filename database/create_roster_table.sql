CREATE TABLE IF NOT EXISTS roster_members (
  team_id VARCHAR(8) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL
    CHECK (role IN ('player', 'coach')),  -- this check rule prevents invalid roles from entering the database
  position VARCHAR(100) NOT NULL,
  registered BOOLEAN NOT NULL DEFAULT FALSE
);


/*
Module 8 Discussion slides
https://www.dbvis.com/wp-content/uploads/2024/04/SQL-Cheat-Sheet.pdf
Those were my references for creating this code. 

*/
