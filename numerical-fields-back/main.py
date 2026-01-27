import os
import jwt
from dotenv import load_dotenv
from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Response, Request, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from sequences import generate_sequence, validate_formula
from models import SequenceCreate, SequenceUpdate, LoginRequest
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


load_dotenv()

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Hashing
ph = PasswordHasher()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

# JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

security = HTTPBearer()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT funcs
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Public
@app.get("/")
def get_index():
    return {"Hello": "World"}

@app.get("/sequences/{sequence}")
def get_sequence(response: Response, sequence: str):
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id, name, description, formula, expression, color, fun_fact, seed").eq("text_id", sequence).execute()

    if len(result.data) < 1:
        response.status_code = 404
        return {"message": "Sequence not found"}
    
    return result.data[0]

@app.get("/sequences/{sequence}/generate")
def get_sequence(response: Response,
                 sequence: str,
                 count: int = Query(..., title="Number of elements to generate")):
    
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id, name, description, formula, expression, color, fun_fact, seed").eq("text_id", sequence).execute()

    if len(result.data) < 1:
        response.status_code = 404
        return {"message": "Sequence not found"}

    seq = result.data[0]
    result = generate_sequence(seq["expression"], seed=seq["seed"], length=count)

    return {
        "result": result,
        "sequence": seq
    }

@app.get("/sequences", response_model=List[str])
def list_sequences():
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id").execute()

    return list(seq["text_id"] for seq in result.data)

@app.post("/validate")
async def validate_expr(request: Request):
    body_bytes = await request.body()
    formula = body_bytes.decode("utf-8")

    return {"valid": validate_formula(formula)}

@app.post("/auth/login")
def login(login_request: LoginRequest):
    if not verify_password(login_request.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    access_token = create_access_token(data={"sub": "admin"})
    return {"token": access_token, "token_type": "bearer"}

# Private
@app.post("/sequences")
def create_sequence(sequence: SequenceCreate, token_payload: dict = Depends(verify_token)):
    if not validate_formula(sequence.expression):
        raise HTTPException(status_code=400, detail="Invalid expression")
    
    if sequence.id:
        existing = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id").eq("text_id", sequence.id).execute()
        if len(existing.data) > 0:
            raise HTTPException(status_code=400, detail="Sequence with this ID already exists")
    
    data = {
        "text_id": sequence.id or sequence.name.lower().replace(" ", "_"),
        "name": sequence.name,
        "description": sequence.description,
        "formula": sequence.formula,
        "expression": sequence.expression,
        "color": sequence.color,
        "fun_fact": sequence.fun_fact,
        "seed": sequence.seed
    }
    
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).insert(data).execute()
    
    if len(result.data) < 1:
        raise HTTPException(status_code=500, detail="Failed to create sequence")
    
    return result.data[0]

@app.put("/sequences/{sequence}")
def update_sequence(sequence: str, 
                   update_data: SequenceUpdate, 
                   token_payload: dict = Depends(verify_token)):
    existing = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("*").eq("text_id", sequence).execute()
    
    if len(existing.data) < 1:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    if update_data.expression and not validate_formula(update_data.expression):
        raise HTTPException(status_code=400, detail="Invalid expression")
    
    data = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).update(data).eq("text_id", sequence).execute()
    
    if len(result.data) < 1:
        raise HTTPException(status_code=500, detail="Failed to update sequence")
    
    return result.data[0]

@app.delete("/sequences/{sequence}")
def delete_sequence(sequence: str, token_payload: dict = Depends(verify_token)):
    existing = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id").eq("text_id", sequence).execute()
    
    if len(existing.data) < 1:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).delete().eq("text_id", sequence).execute()
    
    return {"message": "Sequence deleted successfully", "text_id": sequence}