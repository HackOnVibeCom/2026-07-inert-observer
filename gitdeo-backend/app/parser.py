"""
GitDeo parser.

Scoped deliberately to Arduino/C++ sketches only. A generic multi-language
parser is not realistic to make robust in a hackathon window - one language
done well beats three done fragile.

Strategy: strip comments, then split by top-level function definitions using
brace matching (not just regex line matching), so nested braces inside a
function don't break the split.
"""
import re
from dataclasses import dataclass, field


@dataclass
class CodeModule:
    title: str
    kind: str  # "include" | "define" | "global" | "function"
    body: str


def strip_comments(code: str) -> str:
    # Remove /* ... */ block comments (non-greedy, handles multi-line)
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
    # Remove // line comments
    code = re.sub(r"//.*", "", code)
    return code


def extract_includes_and_defines(code: str) -> list[CodeModule]:
    modules = []
    for match in re.finditer(r"^\s*#include\s*[<\"].+[>\"]", code, flags=re.MULTILINE):
        modules.append(CodeModule(title="Include", kind="include", body=match.group().strip()))
    for match in re.finditer(r"^\s*#define\s+\S+.*", code, flags=re.MULTILINE):
        modules.append(CodeModule(title="Define", kind="define", body=match.group().strip()))
    return modules


def extract_functions(code: str) -> list[CodeModule]:
    """
    Finds `returnType name(args) { ... }` blocks using brace counting,
    so nested if/for/while blocks inside a function don't truncate it early.
    """
    modules = []
    pattern = re.compile(r"\b(?:void|int|float|double|bool|char|String|byte|long)\s+(\w+)\s*\([^;{}]*\)\s*\{")
    for match in pattern.finditer(code):
        func_name = match.group(1)
        start = match.end() - 1  # position of the opening brace
        depth = 0
        end = None
        for i in range(start, len(code)):
            if code[i] == "{":
                depth += 1
            elif code[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end is None:
            continue  # unbalanced braces, skip rather than crash
        body = code[match.start():end].strip()
        modules.append(CodeModule(title=f"Function: {func_name}()", kind="function", body=body))
    return modules


def extract_globals(code: str, function_modules: list[CodeModule]) -> list[CodeModule]:
    # crude but safe: variable declarations at the top level, outside any function body
    used_spans = set()
    for m in function_modules:
        used_spans.add(m.body)

    modules = []
    for match in re.finditer(
        r"^\s*(?:static\s+)?(?:int|float|double|bool|char|String|byte|long|unsigned\s+int)\s+\w+\s*(=\s*[^;]+)?;",
        code, flags=re.MULTILINE
    ):
        line = match.group().strip()
        if not any(line in span for span in used_spans):
            modules.append(CodeModule(title="Global variable", kind="global", body=line))
    return modules


def parse_sketch(raw_code: str) -> list[dict]:
    """
    Main entry point. Returns an ordered list of module dicts ready for the
    video frame generator: [{title, kind, body}, ...]
    """
    if not raw_code or not raw_code.strip():
        raise ValueError("Empty file: nothing to parse")

    code = strip_comments(raw_code)

    includes_defines = extract_includes_and_defines(code)
    functions = extract_functions(code)
    globals_ = extract_globals(code, functions)

    # Order: setup() and loop() first if present (Arduino convention), then
    # includes/defines, then remaining functions, then globals.
    setup_loop = [m for m in functions if m.title in ("Function: setup()", "Function: loop()")]
    other_functions = [m for m in functions if m not in setup_loop]

    ordered = includes_defines + globals_ + setup_loop + other_functions

    if not ordered:
        raise ValueError("No recognizable Arduino/C++ structures found in this file")

    return [{"title": m.title, "kind": m.kind, "body": m.body} for m in ordered]
