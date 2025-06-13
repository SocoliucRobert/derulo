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

## Docker Setup (Alternative Method)

You can also run the entire application using Docker, which simplifies setup across different environments.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Step-by-Step Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/SocoliucRobert/derulo.git
   cd derulo
   ```

2. **Verify Environment Variables:**
   The docker-compose.yml file already includes the necessary environment variables:
   - Database credentials
   - Supabase configuration
   - Secret keys
   
   If you need to modify any values, edit the `docker-compose.yml` file directly.

3. **Build and Start the Containers:**
   ```bash
   docker-compose up -d
   ```
   This command builds and starts all services in detached mode.
   
   **Note:** The backend container automatically runs both `init_db.py` and `populate_db.py` scripts on startup to initialize and populate the database with sample data.

4. **Access the Application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

5. **View Logs (Optional):**
   ```bash
   # View all logs
   docker-compose logs
   
   # View specific service logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

6. **Stop the Application:**
   ```bash
   docker-compose down
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
