from pydantic import BaseModel

class LoginRequest(BaseModel):
    password: str

class SequenceCreate(BaseModel):
    id: str | None = None  # text_id
    name: str
    description: str
    formula: str
    expression: str
    color: str
    fun_fact: str | None = None
    seed: list[int] | None = None

class SequenceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    formula: str | None = None
    expression: str | None = None
    color: str | None = None
    fun_fact: str | None = None
    seed: list[int] | None = None