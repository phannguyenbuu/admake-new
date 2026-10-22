# -*- coding: utf-8 -*-
"""Phần parser biểu thức nguyên tố (primary): literal, identifier, từ khóa, toán tử đầu biểu thức, hash."""


class ParserPrimaryMixin:
    # ---------------- primary ----------------
    def parse_primary(self):
        t = self.tok
        k = t.kind
        if k == "NUM":
            self.advance()
            return ("num", t.value)
        if k == "STR":
            self.advance()
            node = self.parse_string_parts(t.value, t.line)
            # nối chuỗi liền kề "a" "b"
            while self.tok.kind == "STR" and self.tok.spc:
                nxt = self.advance()
                node = ("dstr", [node, self.parse_string_parts(nxt.value, nxt.line)])
            return node
        if k == "DSYM":
            self.advance()
            return ("dsym", self.parse_string_parts(t.value, t.line))
        if k == "SYM":
            self.advance()
            return ("sym", t.value)
        if k == "WORDS":
            self.advance()
            kind = "sym" if t.extra == "sym" else "str"
            return ("array", [(kind, w) for w in t.value])
        if k in ("IVAR", "CVAR"):
            self.advance()
            return ("ivar", t.value)
        if k == "GVAR":
            self.advance()
            return ("gvar", t.value)
        if k == "CONST":
            self.advance()
            if self.is_op("(") and not self.tok.spc:
                return self.parse_call_rest(None, t.value, False)
            if self.tok.kind == "STR" and self.tok.spc and t.value in ("Integer", "Float", "String", "Array"):
                return self.parse_call_rest(None, t.value, False)
            return ("const", None, t.value)
        if k == "ID":
            return self.parse_identifier()
        if k == "KW":
            return self.parse_keyword()
        if k == "OP":
            return self.parse_op_primary()
        if k == "LABEL":
            self.error("label không đúng chỗ")
        self.error("biểu thức không hợp lệ")

    def parse_identifier(self):
        t = self.advance()
        name = t.value
        if self.is_op("(") and not self.tok.spc:
            return self.parse_call_rest(None, name, False)
        if self.is_local(name):
            return ("lvar", name)
        if self.can_start_command_arg():
            args = self.parse_command_args()
            block = self.parse_block_opt(False)
            return ("call", None, name, args, block, False)
        block = self.parse_block_opt(True)
        if block is not None:
            return ("call", None, name, [], block, False)
        return ("var", name)

    def parse_keyword(self):
        t = self.advance()
        v = t.value
        if v == "nil":
            return ("nil",)
        if v == "true":
            return ("true",)
        if v == "false":
            return ("false",)
        if v == "self":
            return ("self",)
        if v == "__method__":
            return ("str", "")
        if v == "def":
            return self.parse_def()
        if v == "if":
            return self.parse_if()
        if v == "unless":
            return self.parse_if(negate=True)
        if v == "while":
            return self.parse_while()
        if v == "until":
            return self.parse_while(until=True)
        if v == "for":
            return self.parse_for()
        if v == "case":
            return self.parse_case()
        if v == "begin":
            return ("kwbegin", self.parse_begin_body())
        if v == "module":
            return self.parse_module(False)
        if v == "class":
            return self.parse_module(True)
        if v in ("return", "next", "break"):
            return (v, self.parse_value_list())
        if v in ("redo", "retry"):
            return ("nil",)
        if v in ("yield", "super"):
            args = None
            if self.is_op("(") and not self.tok.spc:
                self.advance()
                args = self.parse_call_args(")")
                self.expect_op(")")
            elif self.can_start_command_arg():
                args = self.parse_command_args()
            if v == "yield":
                return ("yield", args or [])
            return ("super", args)
        if v == "alias":
            a = self.advance().value
            b = self.advance().value
            return ("alias", str(a), str(b))
        if v == "not":
            return ("not", self.parse_expr())
        if v == "defined?":
            paren = self.accept_op("(")
            e = self.parse_expr()
            if paren:
                self.expect_op(")")
            return ("defined", e)
        self.p -= 1
        self.error("từ khóa không đúng chỗ")

    def parse_op_primary(self):
        t = self.tok
        v = t.value
        if v == "(":
            self.advance()
            saved = self.no_do
            self.no_do = 0
            self.skip_terms()
            if self.accept_op(")"):
                self.no_do = saved
                return ("nil",)
            stmts = self.parse_stmts((")",))
            self.expect_op(")")
            self.no_do = saved
            return stmts[0] if len(stmts) == 1 else ("block", stmts)
        if v == "[":
            self.advance()
            args = self.parse_call_args("]")
            self.expect_op("]")
            return ("array", args)
        if v == "{":
            return self.parse_hash()
        if v == "->":
            self.advance()
            self.push_scope(False)
            params = []
            if self.accept_op("("):
                params = self.parse_param_list((")",))
                self.expect_op(")")
            elif self.tok.kind == "ID":
                params = self.parse_param_list(("{",))
            if self.is_op("{"):
                self.advance()
                saved = self.no_do
                self.no_do = 0
                body = ("block", self.parse_stmts(("}",)))
                self.expect_op("}")
                self.no_do = saved
            else:
                self.expect_kw("do")
                body = self.parse_begin_body()
            self.pop_scope(False)
            return ("lambda", params, body)
        if v == "::":
            self.advance()
            nt = self.advance()
            return ("const", None, nt.value)
        if v in ("..", "..."):
            self.advance()
            return ("range", ("nil",), self.parse_binary(0), v == "...")
        if v in ("-", "!", "+", "~"):
            return self.parse_unary()
        self.error("toán tử không đúng chỗ")

    def parse_hash(self):
        self.expect_op("{")
        saved = self.no_do
        self.no_do = 0
        self.skip_nl()
        pairs = []
        while not self.is_op("}"):
            t = self.tok
            if t.kind == "LABEL":
                self.advance()
                self.skip_nl()
                pairs.append((("sym", t.value), self.parse_arg_expr()))
            elif t.kind == "STR" and self.peek().kind == "OP" and self.peek().value == ":" and not self.peek().spc:
                self.advance()
                self.advance()
                self.skip_nl()
                pairs.append((("dsym", self.parse_string_parts(t.value, t.line)), self.parse_arg_expr()))
            elif self.is_op("**"):
                self.advance()
                pairs.append((("dsplat",), self.parse_ternary()))
            else:
                key = self.parse_arg_expr()
                self.skip_nl()
                self.expect_op("=>")
                self.skip_nl()
                pairs.append((key, self.parse_arg_expr()))
            self.skip_nl()
            if not self.accept_op(","):
                break
            self.skip_nl()
        self.skip_nl()
        self.expect_op("}")
        self.no_do = saved
        return ("hash", pairs)
