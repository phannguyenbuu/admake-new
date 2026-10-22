# -*- coding: utf-8 -*-
"""Lexer cho tập con Ruby đủ để chạy các script SketchUp do AI sinh ra."""

from dataclasses import dataclass, field
from typing import Any, List

from .lexer_str import LexerStrMixin, _is_ident_char, _is_ident_start

KEYWORDS = {
    "def", "end", "if", "elsif", "else", "unless", "while", "until", "for", "in", "do",
    "return", "next", "break", "case", "when", "then", "begin", "rescue", "ensure",
    "module", "class", "self", "nil", "true", "false", "and", "or", "not", "yield",
    "super", "redo", "retry", "defined?", "__method__", "alias", "undef",
}

# Token kết thúc ở cuối dòng => dòng sau là phần tiếp theo của biểu thức
CONTINUATION_OPS = {
    ",", "(", "[", "{", ".", "&.", "&&", "||", "=", "+=", "-=", "*=", "/=", "||=", "&&=",
    "**=", "%=", "<<=", "=>", "?", "+", "-", "*", "/", "%", "**", "==", "!=", "<", ">",
    "<=", ">=", "<=>", "<<", ">>", "&", "^", "::", "..", "...", "->", "!", "===", "=~",
}
CONTINUATION_KW = {"and", "or", "not"}

THREE_CHAR_OPS = ["**=", "||=", "&&=", "<=>", "===", "...", "<<="]
TWO_CHAR_OPS = [
    "**", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>", "+=", "-=", "*=", "/=", "%=",
    "..", "::", "=>", "->", "&.", "=~", "!~", "|=", "&=", "^=",
]
ONE_CHAR_OPS = set("+-*/%=<>!&|^~?:,.;()[]{}")


class RubyLexError(Exception):
    pass


@dataclass
class Token:
    kind: str  # NUM STR SYM ID CONST IVAR GVAR CVAR LABEL OP KW NL EOF WORDS
    value: Any
    line: int
    spc: bool = False  # có khoảng trắng ngay trước token
    extra: Any = field(default=None)

    def __repr__(self):
        return f"Token({self.kind},{self.value!r},L{self.line})"


class Lexer(LexerStrMixin):
    def __init__(self, src: str):
        self.src = src.replace("\r\n", "\n").replace("\r", "\n")
        self.i = 0
        self.line = 1
        self.tokens: List[Token] = []
        self.paren_stack: List[str] = []
        self.heredoc_skip_to = None

    # ------------------------------------------------------------------
    def error(self, msg):
        raise RubyLexError(f"Lỗi cú pháp dòng {self.line}: {msg}")

    def peek(self, k=0):
        j = self.i + k
        return self.src[j] if j < len(self.src) else ""

    def prev_is_value(self) -> bool:
        """Token trước có phải là giá trị (để phân biệt toán tử 2 ngôi / 1 ngôi)."""
        if not self.tokens:
            return False
        t = self.tokens[-1]
        if t.kind in ("NUM", "STR", "SYM", "IVAR", "GVAR", "CVAR", "CONST", "WORDS"):
            return True
        if t.kind == "ID":
            return True
        if t.kind == "KW" and t.value in ("end", "self", "nil", "true", "false"):
            return True
        if t.kind == "OP" and t.value in (")", "]", "}"):
            return True
        return False

    def add(self, kind, value, spc, extra=None):
        self.tokens.append(Token(kind, value, self.line, spc, extra))

    # ------------------------------------------------------------------
    def tokenize(self) -> List[Token]:
        src = self.src
        n = len(src)
        spc = False
        at_line_start = True
        while self.i < n:
            c = src[self.i]

            # =begin ... =end
            if at_line_start and src.startswith("=begin", self.i):
                end = src.find("\n=end", self.i)
                if end < 0:
                    self.i = n
                    break
                self.line += src.count("\n", self.i, end + 5)
                self.i = end + 5
                continue
            if at_line_start and src.startswith("__END__", self.i):
                break
            at_line_start = False

            if c in " \t":
                self.i += 1
                spc = True
                continue
            if c == "\\" and self.peek(1) == "\n":
                self.i += 2
                self.line += 1
                spc = True
                continue
            if c == "#":
                while self.i < n and src[self.i] != "\n":
                    self.i += 1
                continue
            if c == "\n":
                self._newline()
                self.i += 1
                self.line += 1
                if self.heredoc_skip_to is not None:
                    self.line += src.count("\n", self.i, self.heredoc_skip_to)
                    self.i = self.heredoc_skip_to
                    self.heredoc_skip_to = None
                spc = True
                at_line_start = True
                continue

            start_spc = spc
            spc = False

            if c.isdigit():
                self._number(start_spc)
                continue
            if c == '"' or c == "`":
                self.i += 1
                self._dstring(c, start_spc)
                continue
            if c == "'":
                self.i += 1
                self._sstring(start_spc)
                continue
            if c == "%" and self.peek(1) in "wiWI" and self.peek(2) in "[({<|!/" and (
                not self.prev_is_value() or start_spc
            ):
                self._words(start_spc)
                continue
            if c == "%" and self.peek(1) in "qQ" and self.peek(2) in "[({<|!/" and not self.prev_is_value():
                self._percent_string(start_spc)
                continue
            if c == "@":
                j = self.i + 1
                kind = "IVAR"
                if self.peek(1) == "@":
                    j += 1
                    kind = "CVAR"
                k = j
                while k < n and _is_ident_char(src[k]):
                    k += 1
                self.add(kind, src[self.i:k], start_spc)
                self.i = k
                continue
            if c == "$":
                k = self.i + 1
                while k < n and (_is_ident_char(src[k]) or src[k] in "!@&~0123456789"):
                    k += 1
                    if not _is_ident_char(src[k - 1]):
                        break
                self.add("GVAR", src[self.i:k], start_spc)
                self.i = k
                continue
            if c == ":" and self.peek(1) == '"':
                self.i += 2
                self._dstring('"', start_spc)
                tok = self.tokens[-1]
                tok.kind = "DSYM"
                continue
            if c == ":" and self.peek(1) != ":" and (
                _is_ident_start(self.peek(1)) or (self.peek(1) in "+-*/<=>![%" and not self.prev_is_value())
            ) and (not self.prev_is_value() or start_spc):
                # symbol
                k = self.i + 1
                if _is_ident_start(src[k]):
                    while k < n and _is_ident_char(src[k]):
                        k += 1
                    if k < n and src[k] in "?!=" and not (k + 1 < n and src[k + 1] in "=~>"):
                        k += 1
                else:
                    for op in ("[]=", "[]", "<=>", "==", "<=", ">=", "**", "+", "-", "*", "/", "<", ">", "!", "%"):
                        if src.startswith(op, k):
                            k += len(op)
                            break
                self.add("SYM", src[self.i + 1:k], start_spc)
                self.i = k
                continue
            if _is_ident_start(c):
                self._ident(start_spc)
                continue

            # operators
            op = None
            for cand in THREE_CHAR_OPS:
                if src.startswith(cand, self.i):
                    op = cand
                    break
            if op is None:
                for cand in TWO_CHAR_OPS:
                    if src.startswith(cand, self.i):
                        op = cand
                        break
            if op is None and c in ONE_CHAR_OPS:
                op = c
            if op is None:
                self.error(f"ký tự không hợp lệ {c!r}")
            # heredoc <<~ID / <<-ID
            if op in ("<<",) and self.peek(2) in "~-" and (self.peek(3).isupper() or self.peek(3) in "'\""):
                if self._heredoc(start_spc):
                    continue
            self.i += len(op)
            if op in ("(", "[", "{"):
                self.paren_stack.append(op)
            elif op in (")", "]", "}"):
                if self.paren_stack:
                    self.paren_stack.pop()
            if op == ";":
                self._newline(force=True)
                continue
            self.add("OP", op, start_spc)

        self._newline()
        self.add("EOF", None, True)
        return self.tokens

    # ------------------------------------------------------------------
    def _newline(self, force=False):
        if not self.tokens:
            return
        last = self.tokens[-1]
        if last.kind == "NL":
            return
        if not force:
            if self.paren_stack and self.paren_stack[-1] in ("(", "["):
                return
            if last.kind == "OP" and last.value in CONTINUATION_OPS:
                # `|` ở cuối dòng thường là đóng tham số block => vẫn cho xuống dòng
                return
            if last.kind == "KW" and last.value in CONTINUATION_KW:
                return
            # dòng tiếp theo bắt đầu bằng .method => nối chuỗi
            j = self.i + 1
            src = self.src
            while True:
                while j < len(src) and src[j] in " \t\n":
                    j += 1
                if j < len(src) and src[j] == "#":
                    while j < len(src) and src[j] != "\n":
                        j += 1
                    continue
                break
            if j < len(src) and (
                (src[j] == "." and j + 1 < len(src) and src[j + 1] != ".")
                or src.startswith("&.", j)
            ):
                return
        self.add("NL", None, True)

    def _number(self, spc):
        src = self.src
        n = len(src)
        k = self.i
        if src.startswith(("0x", "0X"), k):
            k += 2
            while k < n and (src[k] in "0123456789abcdefABCDEF_"):
                k += 1
            self.add("NUM", int(src[self.i + 2:k].replace("_", ""), 16), spc)
            self.i = k
            return
        is_float = False
        while k < n and (src[k].isdigit() or src[k] == "_"):
            k += 1
        if k < n - 1 and src[k] == "." and src[k + 1].isdigit():
            is_float = True
            k += 1
            while k < n and (src[k].isdigit() or src[k] == "_"):
                k += 1
        if k < n and src[k] in "eE" and (
            (k + 1 < n and src[k + 1].isdigit()) or (k + 2 < n and src[k + 1] in "+-" and src[k + 2].isdigit())
        ):
            is_float = True
            k += 2
            while k < n and src[k].isdigit():
                k += 1
        text = src[self.i:k].replace("_", "")
        self.add("NUM", float(text) if is_float else int(text), spc)
        self.i = k
        # hậu tố r (rational) / i (complex) bỏ qua
        if self.i < n and src[self.i] == "r" and not (self.i + 1 < n and _is_ident_char(src[self.i + 1])):
            self.i += 1

    def _ident(self, spc):
        src = self.src
        n = len(src)
        k = self.i
        while k < n and _is_ident_char(src[k]):
            k += 1
        # hậu tố ? hoặc !
        if k < n and src[k] in "?!" and not (k + 1 < n and src[k + 1] == "="):
            k += 1
        word = src[self.i:k]
        # label `key: value` (không phải `::`)
        prev = self.tokens[-1] if self.tokens else None
        if (
            k < n and src[k] == ":" and not (k + 1 < n and src[k + 1] == ":")
            and not (prev and prev.kind == "OP" and prev.value in (".", "&."))
            and (k + 1 >= n or src[k + 1] in " \t\n)")
            and not word.endswith("?")
        ):
            # ternary `a ? b : c` với b là identifier: ta chỉ coi là label nếu không có '?' đang chờ
            if not self._pending_ternary():
                self.add("LABEL", word, spc)
                self.i = k + 1
                return
        self.i = k
        after_dot = bool(prev and prev.kind == "OP" and prev.value in (".", "&."))
        if word in KEYWORDS and not after_dot:
            self.add("KW", word, spc)
            return
        if word[0].isupper():
            self.add("CONST", word, spc)
        else:
            self.add("ID", word, spc)

    def _pending_ternary(self) -> bool:
        depth = 0
        for t in reversed(self.tokens):
            if t.kind == "NL":
                return False
            if t.kind == "OP":
                if t.value in (")", "]", "}"):
                    depth += 1
                elif t.value in ("(", "[", "{"):
                    if depth == 0:
                        return False
                    depth -= 1
                elif t.value == "?" and depth == 0:
                    return True
                elif t.value == ":" and depth == 0:
                    return False
        return False


def tokenize(src: str) -> List[Token]:
    return Lexer(src).tokenize()
