# CEN3031_group_project

## Run locally

Requirements: Node.js and PostgreSQL.

1. Create a PostgreSQL database and run `database/create_roster_table.sql`, then
   `database/seed_roster.sql` against it.
2. Create `backend/.env` with the database connection settings:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_NAME=your_database_name
   DB_PASSWORD=your_postgres_password
   ```

3. In one terminal, install and start the API:

   ```powershell
   cd backend
   npm install
   npm start
   ```

4. In a second terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite. The frontend sends identity checks to the
   backend through its `/api` development proxy. Use an identity present in the
   seeded roster to sign in.

The current login verifies roster information (team ID, name, and role); it
does not use a password or create a server-side session. Treat it as a project
prototype, not production-grade authentication.