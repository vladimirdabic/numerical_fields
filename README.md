# Numerical Fields

This is a college project for the web technologies class.

**Front-end**: React + Vite + Tailwind CSS \
**Back-end**: Python + FastAPI \
**Database**: Supabase

## Setup

### Front end
To run the front-end locally, you need to install all node dependencies via:
```bash
npm install
```

Make sure to setup the environment with the following variables:
```bash
VITE_BACKEND_URL= ...
```

After that, you can start the project via:
```bash
npm run dev
```

### Back end
First create a python virtual environment via:
```bash
python -m venv venv
```

Enable the virtual environment:
```bash
# Windows
venv\scripts\activate

# Linux/MacOS
source venv/bin/activate
```

Then install the python modules required with pip:
```bash
pip install -r requirements.txt
```

Make sure to setup the environment with the following variables:
```bash
# For CORS
FRONTEND_URL=...

# Supabase
SUPABASE_KEY=...
SUPABASE_URL=...
SUPABASE_SEQ_TABLE=sequences
```

Then run the server with FastAPI:
```bash
fastapi dev main.py
```