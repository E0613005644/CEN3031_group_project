CREATE TABLE IF NOT EXISTS events(
    id SERIAL PRIMARY KEY,
    title VARCHAR(355) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL, /* changed from TIMESTAMP to TIMESTAMPTZ so that PostgreSQL can convert time correctly for the current time zone */
    end_time TIMESTAMPTZ NOT NULL,
    descr VARCHAR(255),
    CHECK(end_time>start_time),
    CHECK(event_type IN('practice', 'game', 'meeting', 'travel', 'other'))
);

/*
My references for this code are below:
https://www.postgresql.org/docs/current/sql-createtable.html
*/