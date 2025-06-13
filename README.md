# FIESC Exam Scheduler

This is a full-stack application for managing exam schedules at FIESC.

## Project Structure

-   `/frontend`: Contains the React application.
-   `/backend`: Contains the Flask API and database logic.

## Setup Instructions

### 1. PostgreSQL Installation and Configuration

1.  **Download and Install PostgreSQL:**
    *   Go to the [PostgreSQL download page](https://www.postgresql.org/download/) and download the installer for your operating system.
    *   During installation, you will be prompted to set a password for the default `postgres` user. **Remember this password.** For this project, we will assume the password is `student123` as you provided, but you should use a strong password in production.
    *   The installer will also install pgAdmin, a graphical interface for managing your databases.

2.  **Create the Database:**
    *   Open pgAdmin.
    *   Connect to your PostgreSQL server using the password you set during installation.
    *   In the object browser on the left, right-click on `Databases` and select `Create` -> `Database...`.
    *   Enter `exam` as the database name and click `Save`.

### 2. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**
    *   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure Environment Variables:**
    *   The `backend` directory contains a `.env` file. Open it and update the `DATABASE_URL` with your PostgreSQL credentials. The format is:
        `postgresql://<user>:<password>@<host>:<port>/<database>`
    *   It should look like this with the details you provided:
        `postgresql://postgres:student123@localhost:5432/exam`

6.  **Initialize the Database:**
    *   Run the `init_db.py` script to create the necessary tables:
        ```bash
        python init_db.py
        ```

7.  **Run the Flask server:**
    ```bash
    flask run
    ```
    The backend will be running at `http://127.0.0.1:5000`.

### 3. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the React application:**
    ```bash
    npm start
    ```
    The frontend will open in your browser at `http://localhost:3000`.

### 4. Supabase Configuration

1.  **Google OAuth Provider:**
    *   Log in to your [Supabase dashboard](https://supabase.com/).
    *   Go to `Authentication` -> `Providers`.
    *   Enable the `Google` provider and follow the instructions to add your Google OAuth credentials (Client ID and Client Secret). You can get these from the [Google Cloud Console](https://console.cloud.google.com/).
    *   Make sure to add `http://localhost:3000` to the list of authorized redirect URIs in your Google Cloud OAuth consent screen configuration.

## Docker Setup

You can run the entire application using Docker, which simplifies setup across different environments.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)

### Option 1: Using Docker CLI (Recommended)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/SocoliucRobert/derulo.git
   cd derulo
   ```

2. **Create a Docker Network:**
   ```bash
   docker network create derulo-network
   ```

3. **Start PostgreSQL Database:**
   ```bash
   docker run -d --name derulo-postgres \
     --network derulo-network \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=student123 \
     -e POSTGRES_DB=exam \
     -p 5432:5432 \
     -v postgres_data:/var/lib/postgresql/data \
     postgres:13
   ```

4. **Build and Start Backend:**
   ```bash
   # Build backend image
   docker build -t derulo-backend ./backend
   
   # Run backend container
   docker run -d --name derulo-backend \
     --network derulo-network \
     -e DATABASE_URL=postgresql://postgres:student123@derulo-postgres:5432/exam \
     -e FLASK_ENV=development \
     -e FLASK_APP=app.py \
     -e FLASK_DEBUG=1 \
     -e SECRET_KEY=d2a8f3c6e4b1a9d8c7b6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4 \
     -e SUPABASE_URL=https://vbopkjfdndwrwwysjfyy.supabase.co \
     -e SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZib3BramZkbmR3cnd3eXNqZnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTU2MTAsImV4cCI6MjA2NTE5MTYxMH0.LVIaEPQCChFiPpgJHaUZOv1DKcTrbju-Sr476T1Z5Hs \
     -e SUPABASE_JWT_SECRET=NHKbGT35MB9mAeqjV4OGRx8zemYCqUuQnvXpJyJWLb1PErQEdPesubtRryrVyR6dHUiA+5jZeNRrZqfyp2d6ZA== \
     -p 5000:5000 \
     derulo-backend
   ```
   
   **Note:** The backend container automatically runs both `init_db.py` and `populate_db.py` scripts on startup to initialize and populate the database with sample data.

5. **Build and Start Frontend:**
   ```bash
   # Build frontend image
   docker build -t derulo-frontend ./frontend
   
   # Run frontend container
   docker run -d --name derulo-frontend \
     --network derulo-network \
     -p 80:80 \
     derulo-frontend
   ```

6. **Access the Application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

7. **View Logs (Optional):**
   ```bash
   # View specific service logs
   docker logs derulo-backend
   docker logs derulo-frontend
   docker logs derulo-postgres
   ```

8. **Stop and Remove All Containers:**
   ```bash
   docker stop derulo-frontend derulo-backend derulo-postgres
   docker rm derulo-frontend derulo-backend derulo-postgres
   ```

### Option 2: Using Docker Compose (Alternative)

If Docker Compose is available on your system, you can use it as an alternative:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/SocoliucRobert/derulo.git
   cd derulo
   ```

2. **Build and Start the Containers:**
   ```bash
   docker-compose up -d
   ```
   or
   ```bash
   docker compose up -d
   ```
   
3. **Stop the Application:**
   ```bash
   docker-compose down
   ```
   or
   ```bash
   docker compose down
   ```

### Troubleshooting Docker Setup

1. **Database Connection Issues:**
   - Check if the database container is running: `docker ps | grep derulo-postgres`
   - Verify the DATABASE_URL in docker-compose.yml

2. **Frontend Not Loading:**
   - Check frontend container logs: `docker logs derulo-frontend`
   - Ensure port 80 is not being used by another service

3. **Backend API Errors:**
   - Check backend logs: `docker logs derulo-backend`
   - Verify all environment variables are correctly set

4. **Docker Compose Not Recognized:**
   - Try using `docker compose` (with a space) instead of `docker-compose`
   - Make sure Docker Desktop is properly installed and running
   - Restart your terminal/PowerShell after installing Docker Desktop
   - If using Docker Engine without Docker Desktop, install Docker Compose separately: `pip install docker-compose`

### Alternative: Using Docker CLI Instead of Docker Compose

If you're having issues with Docker Compose, you can use these Docker CLI commands instead:

1. **Create a Docker Network:**
   ```bash
   docker network create derulo-network
   ```

2. **Start PostgreSQL Database:**
   ```bash
   docker run -d --name derulo-postgres \
     --network derulo-network \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=student123 \
     -e POSTGRES_DB=exam \
     -p 5432:5432 \
     -v postgres_data:/var/lib/postgresql/data \
     postgres:13
   ```

3. **Build and Start Backend:**
   ```bash
   # Build backend image
   docker build -t derulo-backend ./backend
   
   # Run backend container
   docker run -d --name derulo-backend \
     --network derulo-network \
     -e DATABASE_URL=postgresql://postgres:student123@derulo-postgres:5432/exam \
     -e FLASK_ENV=development \
     -e FLASK_APP=app.py \
     -e FLASK_DEBUG=1 \
     -e SECRET_KEY=d2a8f3c6e4b1a9d8c7b6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4 \
     -e SUPABASE_URL=https://vbopkjfdndwrwwysjfyy.supabase.co \
     -e SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZib3BramZkbmR3cnd3eXNqZnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MTU2MTAsImV4cCI6MjA2NTE5MTYxMH0.LVIaEPQCChFiPpgJHaUZOv1DKcTrbju-Sr476T1Z5Hs \
     -e SUPABASE_JWT_SECRET=NHKbGT35MB9mAeqjV4OGRx8zemYCqUuQnvXpJyJWLb1PErQEdPesubtRryrVyR6dHUiA+5jZeNRrZqfyp2d6ZA== \
     -p 5000:5000 \
     derulo-backend
   ```

4. **Build and Start Frontend:**
   ```bash
   # Build frontend image
   docker build -t derulo-frontend ./frontend
   
   # Run frontend container
   docker run -d --name derulo-frontend \
     --network derulo-network \
     -p 80:80 \
     derulo-frontend
   ```

5. **Stop and Remove All Containers:**
   ```bash
   docker stop derulo-frontend derulo-backend derulo-postgres
   docker rm derulo-frontend derulo-backend derulo-postgres
   ```
