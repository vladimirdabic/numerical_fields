import operator


class Interpreter:

    ops = {
        '+': operator.add,
        '-': operator.sub,
        '*': operator.mul,
        '/': operator.truediv,
        '^': operator.pow
    }

    def __init__(self, ctx=None):
        self.ctx = ctx if ctx else {}

    def evaluate(self, node):
        method_name = f"eval_{type(node).__name__}"
        method = getattr(self, method_name)
        return method(node)


    
    def eval_NumberNode(self, node):
        return node.value

    def eval_BinOp(self, node):
        return self.ops[node.op.type](self.evaluate(node.left), self.evaluate(node.right))

    def eval_AssignVar(self, node):
        evaluated = self.evaluate(node.value)
        self.ctx[node.name] = evaluated
        return evaluated

    def eval_Variable(self, node):
        return self.ctx.get(node.name, 0)

    def eval_Call(self, node):
        value_to_call = self.evaluate(node.value)

        if not callable(value_to_call):
            raise Exception("Tried calling a non callable value")

        args = (self.evaluate(arg) for arg in node.args)
        return value_to_call(*args)

    def eval_ArrayNode(self, node):
        return [self.evaluate(element) for element in node.elements]

    def eval_IndexFrom(self, node):
        value = self.evaluate(node.value)

        if not isinstance(value, list):
            raise Exception("Tried indexing from a non list value")

        idx = self.evaluate(node.idx)

        try:
            return value[idx]
        except IndexError:
            return 0

    def eval_SetAtIndex(self, node):
        value = self.evaluate(node.value)

        if not isinstance(value, list):
            raise Exception("Tried setting at index in a non list value")

        idx = self.evaluate(node.idx)
        new = self.evaluate(node.new)

        try:
            value[idx] = new
        except IndexError:
            return 0

        return new