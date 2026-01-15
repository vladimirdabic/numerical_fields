from .classes import *


class Parser:
    def parse(self, tokens):
        self.tokens = tokens
        self.current = 0

        return self.parseAssign()

    def parseAssign(self):
        left = self.parseTerm()

        while self.match('='):
            if type(left) == Variable:
                left = AssignVar(left.name, self.parseAssign())
            elif type(left) == IndexFrom:
                left = SetAtIndex(left.value, left.idx, self.parseAssign())
            else:
                raise Exception("Invalid assignment target (Must be a variable name or array index)")

        return left
    

    def parseTerm(self):
        left = self.parseFactor()

        while self.match('+', '-'):
            op = self.previous()
            right = self.parseFactor()
            left = BinOp(left, right, op)

        return left

    def parseFactor(self):
        left = self.parsePower()

        while self.match('*', '/'):
            op = self.previous()
            right = self.parsePower()
            left = BinOp(left, right, op)

        return left

    def parsePower(self):
        left = self.parseCall()

        while self.match('^'):
            op = self.previous()
            right = self.parseCall()
            left = BinOp(left, right, op)

        return left

    def parseCall(self):
        left = self.parsePrimary()


        while True:
            if self.match('('):
                left = self.finishCall(left)
            elif self.match('['):
                idx = self.parseAssign()
                self.consume(']', "Expected ']' after indexing expression")
                left = IndexFrom(left, idx)
            else:
                break

        return left

    def finishCall(self, value):
        # parse parameters
        args = []
        if not self.check(')'):
            while True:
                args.append(self.parseAssign())

                # check for comma, if no comma, break
                if not self.match(','): break

        self.consume(')', "Expected ')' after function call")
        return Call(value, args)

    def parsePrimary(self):
        if self.match('number'):
            return NumberNode(self.previous().literal)
        if self.match('identifier'):
            return Variable(self.previous().lexeme)

        if self.match('('):
            expr = self.parseAssign()
            self.consume(')', "Expected ')' after grouping expression")
            return expr

        if self.match('['):
            elements = []

            if not self.check(']'):
                while True:
                    elements.append(self.parseAssign())
                    if not self.match(','): break

            self.consume(']', "Expected ']' after array value")
            return ArrayNode(elements)

        raise Exception("Expected expression")



    def consume(self, t_type, errmsg):
        if not self.check(t_type):
            raise Exception(errmsg)

        return self.advance()

    def match(self, *types):
        for t_type in types:
            if self.check(t_type):
                self.advance()
                return True
        return False

    def check(self, t_type):
        return self.peek().type == t_type

    def isAtEnd(self):
        return self.tokens[self.current].type == "EOF"

    def peek(self):
        return self.tokens[self.current]

    def previous(self):
        return self.tokens[self.current-1]

    def advance(self):
        self.current += 1
        return self.previous()


def pretty_print(node, indent="", is_last=True):
    # │   
    # ├── 
    # └── 

    start = "└── " if is_last else "├── "

    if type(node) == str:
        print(indent + start + node)
        return

    print(indent + start + type(node).__name__, end='')


    if type(node) == Token:
        print(" " + node.lexeme)
        return

    print()

    indent += "    " if is_last else "│   "

    children = node.children

    for i, child in enumerate(children):
        pretty_print(child, indent=indent, is_last=i == len(children)-1)
