# -*- coding: utf-8 -*-
"""Phần lexer xử lý chuỗi: escape, chuỗi nháy kép/đơn, %-literal, %w và heredoc."""


def _is_ident_start(c: str) -> bool:
    return c.isalpha() or c == "_" or ord(c) > 127


def _is_ident_char(c: str) -> bool:
    return c.isalnum() or c == "_" or ord(c) > 127


class LexerStrMixin:
    def _read_escape(self) -> str:
        c = self.peek()
        self.i += 1
        mapping = {"n": "\n", "t": "\t", "s": " ", "0": "\0", "e": "\x1b", "r": "\r", "\\": "\\", '"': '"', "#": "#"}
        if c == "u":
            if self.peek() == "{":
                end = self.src.find("}", self.i)
                code = self.src[self.i + 1:end]
                self.i = end + 1
                return "".join(chr(int(h, 16)) for h in code.split())
            code = self.src[self.i:self.i + 4]
            self.i += 4
            return chr(int(code, 16))
        if c == "\n":
            self.line += 1
            return ""
        return mapping.get(c, c)

    def _dstring(self, quote, spc, closer=None):
        closer = closer or quote
        parts = []
        buf = []
        src = self.src
        n = len(src)
        while True:
            if self.i >= n:
                self.error("chuỗi chưa đóng")
            c = src[self.i]
            if c == "\\":
                self.i += 1
                buf.append(self._read_escape())
                continue
            if c == closer:
                self.i += 1
                break
            if c == "#" and self.peek(1) == "{":
                if buf:
                    parts.append("".join(buf))
                    buf = []
                self.i += 2
                depth = 1
                start = self.i
                while self.i < n and depth > 0:
                    ch = src[self.i]
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                    elif ch in "\"'":
                        # bỏ qua chuỗi lồng
                        q = ch
                        self.i += 1
                        while self.i < n and src[self.i] != q:
                            if src[self.i] == "\\":
                                self.i += 1
                            self.i += 1
                    if depth > 0:
                        self.i += 1
                parts.append(("code", src[start:self.i], self.line))
                self.i += 1
                continue
            if c == "\n":
                self.line += 1
            buf.append(c)
            self.i += 1
        if buf or not parts:
            parts.append("".join(buf))
        self.add("STR", parts, spc)

    def _sstring(self, spc, closer="'"):
        buf = []
        src = self.src
        n = len(src)
        while True:
            if self.i >= n:
                self.error("chuỗi chưa đóng")
            c = src[self.i]
            if c == "\\" and self.peek(1) in (closer, "\\"):
                buf.append(self.peek(1))
                self.i += 2
                continue
            if c == closer:
                self.i += 1
                break
            if c == "\n":
                self.line += 1
            buf.append(c)
            self.i += 1
        self.add("STR", ["".join(buf)], spc)

    def _percent_string(self, spc):
        kind = self.peek(1)
        opener = self.peek(2)
        closer = {"[": "]", "(": ")", "{": "}", "<": ">"}.get(opener, opener)
        self.i += 3
        if kind == "Q":
            self._dstring(opener, spc, closer)
        else:
            self._sstring(spc, closer)

    def _words(self, spc):
        kind = self.peek(1)
        opener = self.peek(2)
        closer = {"[": "]", "(": ")", "{": "}", "<": ">"}.get(opener, opener)
        end = self.src.find(closer, self.i + 3)
        if end < 0:
            self.error("%w chưa đóng")
        body = self.src[self.i + 3:end]
        self.line += body.count("\n")
        words = body.split()
        self.i = end + 1
        self.add("WORDS", words, spc, extra="sym" if kind in "iI" else "str")

    def _heredoc(self, spc) -> bool:
        src = self.src
        k = self.i + 3
        quote = None
        if src[k] in "'\"":
            quote = src[k]
            k += 1
        s = k
        while k < len(src) and _is_ident_char(src[k]):
            k += 1
        ident = src[s:k]
        if quote:
            k += 1
        if not ident:
            return False
        squiggly = src[self.i + 2] == "~"
        line_end = src.find("\n", k)
        if line_end < 0:
            return False
        # nội dung heredoc bắt đầu sau dòng hiện tại
        body_start = line_end + 1
        lines = []
        j = body_start
        while j < len(src):
            e = src.find("\n", j)
            if e < 0:
                e = len(src)
            ln = src[j:e]
            if ln.strip() == ident:
                break
            lines.append(ln)
            j = e + 1
        if squiggly:
            indents = [len(ln) - len(ln.lstrip()) for ln in lines if ln.strip()]
            cut = min(indents) if indents else 0
            lines = [ln[cut:] for ln in lines]
        text = "\n".join(lines) + ("\n" if lines else "")
        self.add("STR", [text], spc)
        # phần còn lại của dòng hiện tại lex bình thường; tới cuối dòng thì nhảy qua thân heredoc
        term_end = src.find("\n", j)
        self.heredoc_skip_to = (term_end + 1) if term_end >= 0 else len(src)
        self.i = k
        return True
