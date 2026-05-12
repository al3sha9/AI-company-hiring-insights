# AI-Insights

AI-Insights is a platform designed to aggregate, track, and analyze open roles across leading artificial intelligence companies. By continuously monitoring career boards, the system provides real-time visibility into hiring trends and talent demands within the AI industry.

## Architecture

The project is structured into two main components:

- **Frontend**: A Next.js web application that visualizes job data, trends, and analytics.
- **Backend**: A FastAPI service responsible for executing automated data ingestion pipelines from various job boards (Greenhouse, Lever, Ashby, etc.) and exposing REST endpoints.
- **Database**: Supabase (PostgreSQL) is utilized for persistent storage of job listings, historical role snapshots, and scraping logs.

## Repository Structure

- `/frontend` - Contains the Next.js application, UI components, and client-side logic.
- `/backend` - Contains the FastAPI application, database connectors, and scraper utilities.

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Copy `.env.example` to `.env` and provide your Supabase credentials.
5. Start the API server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
# AI-company-hiring-insights
