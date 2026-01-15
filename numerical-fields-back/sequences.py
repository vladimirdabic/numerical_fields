from typing import List
import mathparser as mp

scanner = mp.Scanner()
parser = mp.Parser()

def generate_sequence(formula: str, seed: List[float] = [0, 1], length: int = 10) -> List[float]:
    results = seed.copy()
    
    tokens = scanner.scan(formula)
    tree = parser.parse(tokens)

    for i in range(len(seed), length):
        ctx = {
            "n": i,
            "history": results,
            "sum": lambda *args: sum(args)
        }
        
        itp = mp.Interpreter(ctx)
        val = itp.evaluate(tree)
        results.append(val)
        
    return results

def validate_formula(formula: str) -> bool:
    try:
        tokens = scanner.scan(formula)
        parser.parse(tokens)
        return True
    except:
        return False