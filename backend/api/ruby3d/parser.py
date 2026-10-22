# -*- coding: utf-8 -*-
"""Parser Ruby (táº­p con) -> AST dáº¡ng tuple. Pháº§n biá»ƒu thá»©c náº±m á»Ÿ parser_expr.py."""

from typing import List, Optional

from .lexer import Token, tokenize


class RubySyntaxError(Exception):
    pass


MODIFIER_KW = ("if", "unless", "while", "until", "rescue")
BLOCK_END_KW = ("end", "else", "elsif", "when", "rescue", "ensure", "then", "in")


class ParserBase:
    def __init__(self, tokens: List[Token]):
        self.toks = tokens
        self.p = 0
        self.no_do = 0  # >0: khÃ´ng cho call lá»“ng nuá»‘t `do` (thuá»™c vá» while/until/for/command ngoÃ i)
        self.local_scopes = [set()]
        self._saved = []

    # ---------------- tiá»‡n Ã­ch token ----------------
    @property
    def tok(self) -> Token:
        return self.toks[self.p]

    def peek(self, k=1) -> Token:
        j = min(self.p + k, len(self.toks) - 1)
        return self.toks[j]

    def advance(self) -> Token:
        t = self.toks[self.p]
        if self.p < len(self.toks) - 1:
            self.p += 1
        return t

    def is_op(self, *vals, tok=None) -> bool:
        t = tok or self.tok
        return t.kind == "OP" and t.value in vals

    def is_kw(self, *vals, tok=None) -> bool:
        t = tok or self.tok
        return t.kind == "KW" and t.value in vals

    def accept_op(self, *vals) -> Optional[Token]:
        if self.is_op(*vals):
            return self.advance()
        return None

    def accept_kw(self, *vals) -> Optional[Token]:
        if self.is_kw(*vals):
            return self.advance()
        return None

    def expect_op(self, val) -> Token:
        if not self.is_op(val):
            self.error(f"cáº§n '{val}'")
        return self.advance()

    def expect_kw(self, val) -> Token:
        if not self.is_kw(val):
            self.error(f"cáº§n '{val}'")
        return self.advance()

    def error(self, msg):
        t = self.tok
        raise RubySyntaxError(f"DÃ²ng {t.line}: {msg}, gáº·p {t.kind} {t.value!r}")

    def skip_nl(self):
        while self.tok.kind == "NL":
            self.advance()

    def skip_terms(self):
        while self.tok.kind == "NL" or self.is_op(";"):
            self.advance()

    # ---------------- local scope ----------------
    def declare(self, name):
        self.local_scopes[-1].add(name)

    def is_local(self, name) -> bool:
        return any(name in s for s in self.local_scopes)

    def push_scope(self, isolated=True):
        """def/module/class: scope má»›i tÃ¡ch biá»‡t; block: káº¿ thá»«a biáº¿n ngoÃ i."""
        if isolated:
            self._saved.append(self.local_scopes)
            self.local_scopes = [set()]
        else:
            self.local_scopes.append(set())

    def pop_scope(self, isolated=True):
        if isolated:
            self.local_scopes = self._saved.pop()
        else:
            self.local_scopes.pop()

    # ---------------- statements ----------------
    def parse_program(self):
        body = self.parse_stmts(("EOF",))
        return ("block", body)

    def at_terminator(self, enders) -> bool:
        t = self.tok
        if t.kind == "EOF":
            return True
        if "EOF" in enders and t.kind == "EOF":
            return True
        if t.kind == "KW" and t.value in enders:
            return True
        if t.kind == "OP" and t.value in enders:
            return True
        return False

    def parse_stmts(self, enders) -> list:
        stmts = []
        self.skip_terms()
        while not self.at_terminator(enders):
            if "EOF" in enders and self.tok.kind == "KW" and self.tok.value in ("end", "else", "elsif", "ensure", "rescue"):
                self.advance()
                self.skip_terms()
                continue
            stmts.append(self.parse_stmt())
            if not (self.tok.kind == "NL" or self.is_op(";") or self.at_terminator(enders)):
                self.error("thiếu xuống dòng giữa các câu lệnh")
            self.skip_terms()
        return stmts

    def parse_body(self, enders=("end",)):
        return ("block", self.parse_stmts(enders))

    def parse_stmt(self):
        node = self.parse_expr_stmt()
        # modifier
        while self.tok.kind == "KW" and self.tok.value in MODIFIER_KW:
            kw = self.advance().value
            self.skip_nl()
            if kw == "rescue":
                alt = self.parse_expr_stmt()
                node = ("begin", node, [([], None, alt)], None, None)
                continue
            cond = self.parse_expr_stmt()
            if kw == "if":
                node = ("if", cond, node, None)
            elif kw == "unless":
                node = ("if", ("not", cond), node, None)
            elif kw == "while":
                node = ("while", cond, node, False, node[0] == "kwbegin")
            else:
                node = ("while", ("not", cond), node, False, node[0] == "kwbegin")
        return node

    def parse_expr_stmt(self):
        # multiple assignment  a, b = ...
        if self._looks_like_masgn():
            return self.parse_masgn()
        node = self.parse_not_expr()
        while self.is_kw("and", "or"):
            kw = self.advance().value
            self.skip_nl()
            right = self.parse_not_expr()
            node = ("and", node, right) if kw == "and" else ("or", node, right)
        return node

    def parse_not_expr(self):
        if self.accept_kw("not"):
            return ("not", self.parse_not_expr())
        return self.parse_expr()

    def _looks_like_masgn(self) -> bool:
        j = self.p
        toks = self.toks
        count = 0
        while True:
            t = toks[j]
            if t.kind == "OP" and t.value == "*":
                j += 1
                t = toks[j]
            if t.kind == "OP" and t.value == "(":
                return False
            if t.kind not in ("ID", "IVAR", "GVAR"):
                return False
            j += 1
            count += 1
            t = toks[j]
            if t.kind == "OP" and t.value == ",":
                j += 1
                continue
            if t.kind == "OP" and t.value == "=" and count > 1:
                return True
            return False

    def parse_masgn(self):
        targets = []
        while True:
            splat = bool(self.accept_op("*"))
            t = self.advance()
            if t.kind == "ID":
                self.declare(t.value)
                tgt = ("lvar", t.value)
            elif t.kind == "IVAR":
                tgt = ("ivar", t.value)
            else:
                tgt = ("gvar", t.value)
            targets.append(("splat", tgt) if splat else tgt)
            if not self.accept_op(","):
                break
        self.expect_op("=")
        self.skip_nl()
        values = [self.parse_arg_expr()]
        while self.accept_op(","):
            self.skip_nl()
            values.append(self.parse_arg_expr())
        return ("masgn", targets, values)

    # ---------------- Ä‘á»‹nh nghÄ©a ----------------
    def parse_def(self):
        singleton = None
        t = self.advance()
        name = t.value
        if t.kind == "KW" and t.value == "self" and self.is_op("."):
            self.advance()
            singleton = "self"
            name = self.advance().value
        elif t.kind == "CONST" and self.is_op("."):
            self.advance()
            singleton = t.value
            name = self.advance().value
        elif t.kind == "OP":
            # def ==(o), def [](i), def +(o), def -@
            name = t.value
            if name == "[" and self.accept_op("]"):
                name = "[]"
                if self.is_op("=") and not self.tok.spc:
                    self.advance()
                    name = "[]="
        if self.is_op("=") and not self.tok.spc and self.peek().kind == "OP" and self.peek().value == "(":
            self.advance()
            name += "="
        self.push_scope()
        params = []
        if self.accept_op("("):
            params = self.parse_param_list((")",))
            self.expect_op(")")
        elif self.tok.kind not in ("NL",) and not self.is_op(";") and not self.is_op("="):
            params = self.parse_param_list(("NL", ";"))
        if self.accept_op("="):
            # endless method: def foo(x) = expr
            self.skip_nl()
            body = ("block", [self.parse_stmt()])
            self.pop_scope()
            return ("def", name, params, body, singleton)
        body = self.parse_begin_body()
        self.pop_scope()
        return ("def", name, params, body, singleton)

    def parse_param_list(self, enders):
        params = []
        while True:
            self.skip_nl() if ")" in enders or "|" in enders else None
            t = self.tok
            if t.kind == "NL" or (t.kind == "OP" and t.value in enders):
                break
            if self.accept_op("*"):
                nm = self.advance().value if self.tok.kind == "ID" else "*"
                self.declare(nm)
                params.append(("rest", nm, None))
            elif self.accept_op("**"):
                nm = self.advance().value if self.tok.kind == "ID" else "**"
                self.declare(nm)
                params.append(("keyrest", nm, None))
            elif self.accept_op("&"):
                nm = self.advance().value
                self.declare(nm)
                params.append(("block", nm, None))
            elif self.accept_op("("):
                subs = self.parse_param_list((")",))
                self.expect_op(")")
                params.append(("destr", subs, None))
            elif t.kind == "LABEL":
                self.advance()
                self.declare(t.value)
                default = None
                if not (self.is_op(",") or self.is_op(*enders) or self.tok.kind == "NL"):
                    default = self.parse_ternary()
                params.append(("key", t.value, default))
            elif t.kind == "ID":
                self.advance()
                self.declare(t.value)
                if self.accept_op("="):
                    params.append(("opt", t.value, self.parse_ternary()))
                else:
                    params.append(("req", t.value, None))
            else:
                self.error("tham sá»‘ khÃ´ng há»£p lá»‡")
            if not self.accept_op(","):
                break
        return params

    def parse_begin_body(self):
        """ThÃ¢n def/begin/do cÃ³ thá»ƒ chá»©a rescue/else/ensure, káº¿t thÃºc báº±ng end."""
        body = self.parse_body(("end", "rescue", "else", "ensure"))
        rescues = []
        else_body = None
        ensure_body = None
        while self.accept_kw("rescue"):
            classes = []
            var = None
            while self.tok.kind == "CONST" or self.is_op("::"):
                classes.append(self.parse_primary())
                if not self.accept_op(","):
                    break
            if self.accept_op("=>"):
                var = self.advance().value
                self.declare(var)
            self.accept_kw("then")
            rbody = self.parse_body(("end", "rescue", "else", "ensure"))
            rescues.append((classes, var, rbody))
        if self.accept_kw("else"):
            else_body = self.parse_body(("end", "ensure"))
        if self.accept_kw("ensure"):
            ensure_body = self.parse_body(("end",))
        self.expect_kw("end")
        if rescues or ensure_body or else_body:
            return ("begin", body, rescues, else_body, ensure_body)
        return body

    def parse_module(self, is_class):
        path = self.parse_cpath()
        sup = None
        if is_class and self.accept_op("<"):
            sup = self.parse_ternary()
        if is_class and self.is_op("<<"):
            # class << self
            self.advance()
            self.parse_ternary()
            self.push_scope()
            body = self.parse_body()
            self.expect_kw("end")
            self.pop_scope()
            return ("sclass", body)
        self.push_scope()
        body = self.parse_body()
        self.expect_kw("end")
        self.pop_scope()
        return ("class" if is_class else "module", path, sup, body)

    def parse_cpath(self):
        if self.is_op("<<"):
            return None
        t = self.advance()
        names = [t.value]
        while self.accept_op("::"):
            names.append(self.advance().value)
        return names

    def parse_if(self, negate=False):
        cond = self.parse_expr_stmt()
        self.accept_kw("then")
        if negate:
            cond = ("not", cond)
        then_b = self.parse_body(("elsif", "else", "end"))
        else_b = None
        if self.accept_kw("elsif"):
            else_b = self.parse_if()
            return ("if", cond, then_b, else_b)
        if self.accept_kw("else"):
            else_b = self.parse_body(("end",))
        self.expect_kw("end")
        return ("if", cond, then_b, else_b)

    def parse_while(self, until=False):
        self.no_do += 1
        cond = self.parse_expr_stmt()
        self.no_do -= 1
        self.accept_kw("do")
        body = self.parse_body(("end",))
        self.expect_kw("end")
        if until:
            cond = ("not", cond)
        return ("while", cond, body, False, False)

    def parse_for(self):
        names = []
        while True:
            t = self.advance()
            self.declare(t.value)
            names.append(t.value)
            if not self.accept_op(","):
                break
        self.expect_kw("in")
        self.no_do += 1
        it = self.parse_expr_stmt()
        self.no_do -= 1
        self.accept_kw("do")
        body = self.parse_body(("end",))
        self.expect_kw("end")
        return ("for", names, it, body)

    def parse_case(self):
        subj = None
        if self.tok.kind != "NL":
            subj = self.parse_expr_stmt()
        self.skip_terms()
        whens = []
        else_b = None
        while self.accept_kw("when"):
            vals = [self.parse_arg_expr()]
            while self.accept_op(","):
                self.skip_nl()
                vals.append(self.parse_arg_expr())
            self.accept_kw("then")
            body = self.parse_body(("when", "else", "end"))
            whens.append((vals, body))
        if self.accept_kw("else"):
            else_b = self.parse_body(("end",))
        self.expect_kw("end")
        return ("case", subj, whens, else_b)


def parse(src: str):
    from .parser_expr import Parser

    return Parser(tokenize(src)).parse_program()
