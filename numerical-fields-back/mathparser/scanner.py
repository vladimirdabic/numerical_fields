from .classes import Token


class Scanner:
    def __init__(self):
        self.tokens = []

    def scan(self, txt):
        self.source = txt
        self.current = 0
        self.line = 1
        self.tokens.clear()

        while not self.isAtEnd():
            self.start = self.current
            self.scanToken()

        self.addToken('EOF')
        return self.tokens.copy()


    def scanToken(self):
        c = self.advance()

        if c in "+-*/^()=,[]":
            self.addToken(c)
        elif c == '\n':
            self.line += 1
        elif c in '\r\t ':
            pass
        elif c.isdigit():
            self.readNumber()
        elif c.isalpha():
            self.readIdentifier()
        else:
            raise Exception(f"[Line {self.line}] Unexpected character '{c}'")

    def readNumber(self):
        while self.peek().isdigit():
            self.advance()

        num_class = int
        if self.match('.'):
            num_class = float
            while self.peek().isdigit():
                self.advance()

        num_literal = num_class(self.source[self.start:self.current])
        self.addToken('number', num_literal)

    def readIdentifier(self):
        while self.peek().isalnum():
            self.advance()

        self.addToken('identifier')

    def addToken(self, t_type, literal=None):
        lexeme = self.source[self.start:self.current]
        self.tokens.append(Token(t_type, lexeme, literal, self.line))

    def match(self, c):
        if self.isAtEnd(): return False
        if self.source[self.current] != c: return False

        self.current += 1
        return True

    def peek(self):
        if self.isAtEnd(): return '\x00'
        return self.source[self.current]

    def advance(self):
        if self.isAtEnd(): return '\x00'
        c = self.source[self.current]
        self.current += 1
        return c

    def isAtEnd(self):
        return self.current >= len(self.source)