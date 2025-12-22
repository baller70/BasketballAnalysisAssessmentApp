# Starting the Python Backend Server

## Quick Start

### 1. Navigate to backend directory
```bash
cd "/Volumes/Softwaare Program/SOFTWARE/BASKETBALLANALYSISTOOL/python-backend"
```

### 2. Create virtual environment (first time only)
```bash
python3 -m venv venv
```

### 3. Activate virtual environment
```bash
source venv/bin/activate
```

### 4. Install dependencies (first time only)
```bash
pip install -r requirements.txt
```

### 5. Start the server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

## Verify It's Running

Open your browser and visit:
- http://localhost:8000/health
- http://localhost:8000/docs (API documentation)

You should see a JSON response indicating the server is healthy.

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

## Deactivate Virtual Environment

```bash
deactivate
```

## Environment Variables

If you need to use Replicate AI features, create a `.env` file in the `python-backend` directory:

```bash
REPLICATE_API_TOKEN=your_token_here
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, change the port:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Then update the frontend environment variable to match.

### Missing Dependencies
```bash
pip install --upgrade -r requirements.txt
```

### Permission Issues
```bash
chmod +x run_dev.sh
./run_dev.sh
```





