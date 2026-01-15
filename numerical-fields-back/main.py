import os
from dotenv import load_dotenv
from typing import List
from fastapi import FastAPI, Response, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from sequences import generate_sequence, validate_formula

load_dotenv()

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def get_index():
    return {"Hello": "World"}

@app.get("/sequences/{sequence}")
def get_sequence(response: Response, sequence: str):
    result = supabase.table(os.getenv("SUPABASE_SEQ_TABLE")).select("text_id, name, description, formula, color, fun_fact").eq("text_id", sequence).execute()

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