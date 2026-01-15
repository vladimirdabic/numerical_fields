

class Token:
    def __init__(self, t_type, lexeme, literal, line):
        self.type = t_type
        self.lexeme = lexeme
        self.literal = literal
        self.line = line

    def __repr__(self):
        return f"Token(type: {self.type}, lexeme: {self.lexeme}, literal: {self.literal}, line: {self.line})"


class Node:
    pass


class NumberNode(Node):
    def __init__(self, num):
        self.value = num

    def __repr__(self):
        return f"Number({self.value})"

    @property
    def children(self):
        return tuple()

class BinOp(Node):
    def __init__(self, l, r, op):
        self.left = l
        self.right = r
        self.op = op

    def __repr__(self):
        return f"BinOp({self.left} {self.op} {self.right})"

    @property
    def children(self):
        return (self.left, self.op, self.right)

class AssignVar(Node):
    def __init__(self, varname, v):
        self.name = varname
        self.value = v

    def __repr__(self):
        return f"Assign({self.name} = {self.value})"

    @property
    def children(self):
        return (self.name, self.value)

class Variable(Node):
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Variable({self.name})"

    @property
    def children(self):
        return (self.name,)

class Call(Node):
    def __init__(self, value, args):
        self.value = value
        self.args = args

    def __repr__(self):
        return f"Call({self.value}, {self.args})"

    @property
    def children(self):
        return (self.value, self.args)

class ArrayNode(Node):
    def __init__(self, elements):
        self.elements = elements

    def __repr__(self):
        return f"Array{self.elements}"

    @property
    def children(self):
        return self.elements

class IndexFrom(Node):
    def __init__(self, value, idx):
        self.value = value
        self.idx = idx

    def __repr__(self):
        return f"IndexFrom({self.value}: {self.idx})"

    @property
    def children(self):
        return (self.value, self.idx)

class SetAtIndex(Node):
    def __init__(self, value, idx, new):
        self.value = value
        self.idx = idx
        self.new = new

    def __repr__(self):
        return f"SetAtIndex({self.value}: {self.idx})"

    @property
    def children(self):
        return (self.value, self.idx, self.new)