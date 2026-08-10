# AI-Insights

AI-Insights is a platform designed to aggregate, track, and analyze open roles across leading artificial intelligence companies. By continuously monitoring career boards, the system provides real-time visibility into hiring trends and talent demands within the AI industry. More details on https://alishan.dev

## Architecture

The project now uses a simpler production shape:

- **Frontend**: A Next.js web application that reads Supabase directly on the server.
- **Database**: Supabase (PostgreSQL) stores roles, historical snapshots, and precomputed read models.
- **Ingestion**: Python scraping and maintenance scripts run locally on a weekly cadence, then refresh the Supabase data and trigger frontend revalidation.

## Repository Structure

- `/frontend` - Contains the Next.js application, UI components, and client-side logic.
- `/backend` - Contains the local scraping, classification, and read-model generation scripts.
- `/supabase/migrations` - Contains SQL for the precomputed read models used by the frontend.

## Local Development

### Local Ingestion Setup

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
5. Run the weekly refresh pipeline:
   ```bash
   python run_weekly_refresh.py
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
3. Configure environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (or legacy `SUPABASE_KEY`)
   - `REVALIDATE_SECRET`
   - `NEXT_PUBLIC_LOGO_DEV_TOKEN`
4. Start the development server:
   ```bash
   npm run dev
   ```
