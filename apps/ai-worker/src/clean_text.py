# clean up the partitioned elements
import re
from unstructured.cleaners.core import (
    clean,
    clean_non_ascii_chars,
    bytes_string_to_string,
    clean_postfix,
    clean_prefix,
)


remove_citations = lambda text: re.sub(r"\[\d+(?:,\s*\d+)*\]", "", text)


def fix_punctuation_spacing(text: str) -> str:
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)  # Remove space before punctuation
    text = re.sub(
        r"([,.;:!?])([^\s])", r"\1 \2", text
    )  # Ensure space after punctuation
    return text


def clean_element_text(element, debug=False):
    """Clean text in partitioned elements before chunking and embedding."""
    if not hasattr(element, "text") or element.text is None:
        return element

    text = element.text
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

    # Drop empty text blocks
    if text == "":
        element.text = ""
        return element

    element.text = text
    if debug:
        print("Cleaned element:", text[:200])
    return element


# Apply cleaning to all parsed elements
cleaned_elements = [clean_element_text(el) for el in elements]
print(f"✅ Cleaned {len(cleaned_elements)} elements")

# Replace elements with cleaned elements for downstream processing
elements = cleaned_elements
