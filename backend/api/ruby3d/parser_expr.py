# -*- coding: utf-8 -*-
"""Phần parser biểu thức (assignment, toán tử, lời gọi hàm, literal, block)."""

from .lexer import tokenize
from .parser import ParserBase, MODIFIER_KW
from .parser_lit import ParserPrimaryMixin

ASSIGN_OPS = {"+=", "-=", "*=", "/=", "%=", "**=", "||=", "&&=", "<<=", "|=", "&=", "^="}

BINARY_LEVELS = [
    ("||",),
    ("&&",),
    ("<=>", "==", "===", "!=", "=~", "!~"),
    ("<", "<=", ">", ">="),
    ("|", "^"),
    ("&",),
    ("<<", ">>"),
    ("+", "-"),
    ("*", "/", "%"),
]

VALUE_KINDS = ("NUM", "STR", "DSYM", "SYM", "ID", "CONST", "IVAR", "GVAR", "CVAR", "LABEL", "WORDS")
VALUE_KWS = ("nil", "true", "false", "self", "not", "defined?", "__method__", "super", "yield",
             "if", "unless", "case", "begin", "while")


class Parser(ParserPrimaryMixin, ParserBase):
    # ---------------- assignment ----------------
    def parse_expr(self):
        left = self.parse_ternary()
        t = self.tok
        if t.kind == "OP" and t.value == "=":
            target = self.to_target(left)
            if target is not None:
                self.advance()
                self.skip_nl()
                value = self.parse_rhs()
                return ("asgn", target, value)
        if t.kind == "OP" and t.value in ASSIGN_OPS:
            target = self.to_target(left)
            if target is not None:
                self.advance()
                self.skip_nl()
                value = self.parse_rhs()
                return ("opasgn", target, t.value[:-1], value)
        return left

    def parse_rhs(self):
        if self.accept_kw("not"):
            return ("not", self.parse_expr())
        return self.parse_expr()

    def to_target(self, node):
        kind = node[0]
        if kind in ("var", "lvar"):
            self.declare(node[1])
            return ("lvar", node[1])
        if kind == "call" and node[1] is None and not node[3] and node[4] is None:
            self.declare(node[2])
            return ("lvar", node[2])
        if kind in ("ivar", "gvar"):
            return node
        if kind == "const":
            return ("cdecl", node[1], node[2])
        if kind == "index":
            return node
        if kind == "call" and node[1] is not None and not node[3] and node[4] is None:
            return ("attrasgn", node[1], node[2])
        return None

    # ---------------- toán tử ----------------
    def parse_ternary(self):
        cond = self.parse_range()
        if self.is_op("?"):
            self.advance()
            self.skip_nl()
            a = self.parse_ternary()
            self.skip_nl()
            if self.tok.kind == "LABEL":
                # `x ? foo: bar` hiếm gặp
                self.error("toán tử 3 ngôi không hợp lệ")
            self.expect_op(":")
            self.skip_nl()
            b = self.parse_ternary()
            return ("if", cond, a, b)
        return cond

    def parse_range(self):
        left = self.parse_binary(0)
        if self.is_op("..", "..."):
            excl = self.advance().value == "..."
            right = None
            if self.can_start_value():
                right = self.parse_binary(0)
            return ("range", left, right, excl)
        return left

    def parse_binary(self, level):
        if level >= len(BINARY_LEVELS):
            return self.parse_unary()
        ops = BINARY_LEVELS[level]
        left = self.parse_binary(level + 1)
        while self.tok.kind == "OP" and self.tok.value in ops:
            op = self.advance().value
            self.skip_nl()
            right = self.parse_binary(level + 1)
            if op == "||":
                left = ("or", left, right)
            elif op == "&&":
                left = ("and", left, right)
            elif op == "!=":
                left = ("not", ("op", "==", left, right))
            elif op == "!~":
                left = ("not", ("op", "=~", left, right))
            else:
                left = ("op", op, left, right)
        return left

    def parse_unary(self):
        t = self.tok
        if t.kind == "OP":
            if t.value == "-":
                self.advance()
                nxt = self.tok
                if nxt.kind == "NUM" and not nxt.spc:
                    self.advance()
                    node = self.parse_postfix_from(("num", -nxt.value))
                    if self.is_op("**"):
                        self.advance()
                        return ("neg", ("op", "**", ("num", nxt.value), self.parse_unary()))
                    return node
                return ("neg", self.parse_pow())
            if t.value == "+":
                self.advance()
                return self.parse_pow()
            if t.value == "!":
                self.advance()
                return ("not", self.parse_unary())
            if t.value == "~":
                self.advance()
                return ("call", self.parse_unary(), "~", [], None, False)
        if t.kind == "KW" and t.value == "defined?":
            self.advance()
            paren = self.accept_op("(")
            e = self.parse_expr()
            if paren:
                self.expect_op(")")
            return ("defined", e)
        if t.kind == "KW" and t.value == "not":
            self.advance()
            return ("not", self.parse_unary())
        return self.parse_pow()

    def parse_pow(self):
        base = self.parse_postfix()
        if self.is_op("**"):
            self.advance()
            self.skip_nl()
            return ("op", "**", base, self.parse_unary())
        return base

    # ---------------- postfix / call ----------------
    def parse_postfix(self):
        return self.parse_postfix_from(self.parse_primary())

    def parse_postfix_from(self, node):
        while True:
            t = self.tok
            if t.kind == "OP" and t.value in (".", "&."):
                safe = t.value == "&."
                self.advance()
                self.skip_nl()
                nt = self.tok
                if nt.kind == "OP" and nt.value == "(":
                    name = "call"
                else:
                    self.advance()
                    name = nt.value
                    if nt.kind == "LABEL":
                        # obj.method key: v  (lexer coi `method:` là label) – hiếm
                        self.error("cú pháp gọi hàm không hỗ trợ")
                node = self.parse_call_rest(node, str(name), safe)
            elif t.kind == "OP" and t.value == "::":
                self.advance()
                nt = self.advance()
                if nt.kind == "CONST" and not (self.is_op("(") and not self.tok.spc):
                    node = ("const", node, nt.value)
                else:
                    node = self.parse_call_rest(node, str(nt.value), False)
            elif t.kind == "OP" and t.value == "[" and not t.spc:
                self.advance()
                args = self.parse_call_args("]")
                self.expect_op("]")
                node = ("index", node, args)
            else:
                return node

    def parse_call_rest(self, recv, name, safe):
        args = []
        has_parens = False
        if self.is_op("(") and not self.tok.spc:
            self.advance()
            args = self.parse_call_args(")")
            self.expect_op(")")
            has_parens = True
        elif self.can_start_command_arg():
            args = self.parse_command_args()
        block = self.parse_block_opt(has_parens or not args)
        return ("call", recv, name, args, block, safe)

    def can_start_value(self) -> bool:
        t = self.tok
        if t.kind in ("NL", "EOF"):
            return False
        if t.kind == "KW" and (t.value in MODIFIER_KW or t.value in ("end", "then", "do", "and", "or", "else", "elsif", "when", "ensure", "in")):
            return False
        if t.kind == "OP" and t.value in ("}", ")", "]", ";", ",", "=>", ":", "?", "|", "=", "&&", "||"):
            return False
        return True

    def can_start_command_arg(self) -> bool:
        t = self.tok
        if t.kind in ("NL", "EOF") or not t.spc:
            return False
        if t.kind in VALUE_KINDS:
            return True
        if t.kind == "KW":
            return t.value in VALUE_KWS and t.value not in ("if", "unless", "while")
        if t.kind == "OP":
            nxt = self.peek()
            if t.value in ("-", "*", "&", "**", "!", "::") and not nxt.spc and nxt.kind != "NL":
                return True
            if t.value in ("[", "->"):
                return True
            if t.value == "(":
                return True
        return False

    def parse_command_args(self):
        self.no_do += 1
        try:
            args = [self.parse_arg()]
            while self.is_op(","):
                self.advance()
                self.skip_nl()
                args.append(self.parse_arg())
        finally:
            self.no_do -= 1
        return args

    def parse_call_args(self, closer):
        saved = self.no_do
        self.no_do = 0
        args = []
        self.skip_nl()
        while not self.is_op(closer):
            args.append(self.parse_arg())
            self.skip_nl()
            if not self.accept_op(","):
                break
            self.skip_nl()
        self.skip_nl()
        self.no_do = saved
        return args

    def parse_arg(self):
        t = self.tok
        if t.kind == "OP" and t.value == "*":
            self.advance()
            return ("splat", self.parse_ternary())
        if t.kind == "OP" and t.value == "**":
            self.advance()
            return ("dsplat", self.parse_ternary())
        if t.kind == "OP" and t.value == "&":
            self.advance()
            return ("blockpass", self.parse_ternary())
        if t.kind == "LABEL":
            self.advance()
            self.skip_nl()
            if self.is_op(",", ")", "]") or self.tok.kind == "NL":
                return ("pair", ("sym", t.value), ("var", t.value))
            return ("pair", ("sym", t.value), self.parse_arg_expr())
        e = self.parse_arg_expr()
        if self.is_op("=>"):
            self.advance()
            self.skip_nl()
            return ("pair", e, self.parse_arg_expr())
        return e

    def parse_arg_expr(self):
        if self.accept_kw("not"):
            return ("not", self.parse_expr())
        return self.parse_expr()

    # ---------------- block ----------------
    def parse_block_opt(self, allow_brace):
        if allow_brace and self.is_op("{"):
            return self.parse_brace_block()
        if self.is_kw("do") and self.no_do == 0:
            return self.parse_do_block()
        return None

    def parse_block_params(self):
        if self.accept_op("||"):
            return []
        if self.accept_op("|"):
            params = self.parse_param_list(("|", ";"))
            if self.accept_op(";"):
                while not self.is_op("|"):
                    self.advance()
            self.expect_op("|")
            return params
        return []

    def parse_brace_block(self):
        self.expect_op("{")
        self.push_scope(False)
        saved = self.no_do
        self.no_do = 0
        params = self.parse_block_params()
        body = ("block", self.parse_stmts(("}",)))
        self.expect_op("}")
        self.no_do = saved
        self.pop_scope(False)
        return ("blk", params, body)

    def parse_do_block(self):
        self.expect_kw("do")
        self.push_scope(False)
        saved = self.no_do
        self.no_do = 0
        params = self.parse_block_params()
        body = self.parse_begin_body()
        self.no_do = saved
        self.pop_scope(False)
        return ("blk", params, body)

    # ---------------- primary ----------------
    def parse_string_parts(self, parts, line):
        if all(isinstance(p, str) for p in parts):
            return ("str", "".join(parts))
        nodes = []
        for p in parts:
            if isinstance(p, str):
                nodes.append(p)
            else:
                sub = Parser(tokenize(p[1]))
                sub.local_scopes = [set().union(*self.local_scopes)]
                nodes.append(("block", sub.parse_stmts(("EOF",))))
        return ("dstr", nodes)

    def parse_value_list(self):
        if not self.can_start_value():
            return None
        v = self.parse_expr()
        if self.is_op(","):
            items = [v]
            while self.accept_op(","):
                self.skip_nl()
                items.append(self.parse_arg())
            return ("array", items)
        return v
