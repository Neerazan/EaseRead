"""
Text cleaning utilities for parsed document elements.

Applies a pipeline of cleaning transformations to raw text extracted by
``unstructured`` parsers before chunking and embedding.
"""

import re
from typing import Any, List

from unstructured.cleaners.core import (
    bytes_string_to_string,
    clean,
    clean_non_ascii_chars,
    clean_postfix,
    clean_prefix,
)

__all__ = [
    "clean_element_text",
    "clean_elements",
    "fix_punctuation_spacing",
    "remove_citations",
]


# ---------------------------------------------------------------------------
# Individual cleaning helpers
# ---------------------------------------------------------------------------


def remove_citations(text: str) -> str:
    """Remove bracketed numeric citations, e.g. ``[1]``, ``[2, 3]``."""
    return re.sub(r"\[\d+(?:,\s*\d+)*\]", "", text)


def fix_punctuation_spacing(text: str) -> str:
    """Normalise whitespace around common punctuation marks."""
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)  # no space before
    text = re.sub(r"([,.;:!?])([^\s])", r"\1 \2", text)  # ensure space after
    return text


# ---------------------------------------------------------------------------
# Element-level cleaning
# ---------------------------------------------------------------------------


def clean_element_text(element: Any, *, debug: bool = False) -> Any:
    """Apply the full cleaning pipeline to a single *unstructured* element.

    The element is mutated **in place** and also returned for convenience.
    Elements without a ``text`` attribute (or whose text is ``None``) are
    returned unchanged.
    """
    if not hasattr(element, "text") or element.text is None:
        return element

    text: str = element.text

    # Cleaning pipeline — order matters.
    text = remove_citations(text)
    text = fix_punctuation_spacing(text)
    text = clean_non_ascii_chars(text)
    text = bytes_string_to_string(text, encoding="utf-8")
    text = clean_postfix(text, r"(END|STOP)", ignore_case=True)
    text = clean_prefix(text, r"(SUMMARY|DESCRIPTION):", ignore_case=True)
    text = clean(
        text,
        extra_whitespace=True,
        dashes=True,
        bullets=True,
        trailing_punctuation=True,
        lowercase=False,
    )
    text = text.strip()

    element.text = text

    if debug and text:
        print(f"  [clean] {text[:200]}")

    return element


def clean_elements(elements: List[Any], *, debug: bool = False) -> List[Any]:
    """Apply :func:`clean_element_text` to every element in *elements*.

    Empty-text elements are filtered out of the returned list.
    """
    cleaned = [clean_element_text(el, debug=debug) for el in elements]
    return [el for el in cleaned if getattr(el, "text", None)]
