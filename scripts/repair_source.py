from pathlib import Path

APP = Path("App.tsx")

text = APP.read_text(encoding="utf-8-sig")

# App.tsx was once read with a legacy Windows byte mapping and written back as UTF-8.
# Recover the original UTF-8 bytes. Some bytes became C1 controls, while others became
# Windows-1252 printable characters, so use a mixed inverse mapping instead of plain cp1252.
def recover_utf8_mojibake(value: str) -> str:
    raw = bytearray()
    for ch in value:
        code = ord(ch)
        if code <= 0xFF:
            raw.append(code)
            continue
        try:
            encoded = ch.encode("cp1252")
        except UnicodeEncodeError as exc:
            raise ValueError(f"Cannot reverse character U+{code:04X} during mojibake repair") from exc
        if len(encoded) != 1:
            raise ValueError(f"Unexpected multi-byte reverse mapping for U+{code:04X}")
        raw.extend(encoded)
    return raw.decode("utf-8")

markers = ("Ã", "Å", "Ä", "Â", "â")
if any(marker in text for marker in markers):
    text = recover_utf8_mojibake(text)

# Keep the managed Neon Auth native e-mail flow on an absolute HTTPS callback.
# Neon Managed Auth currently accepts only http/https trusted-domain entries,
# while the Expo client app uses the canharitasi:// scheme internally.
if "  NEON_AUTH_URL,\n" not in text:
    text = text.replace("  NearbyReport,\n", "  NearbyReport,\n  NEON_AUTH_URL,\n", 1)

literal = "'https://ep-red-lake-ayk3kz85.neonauth.c-5.us-east-2.aws.neon.tech/canharitasi/auth'"
text = text.replace(f"callbackURL: {literal}", "callbackURL: NEON_AUTH_URL")

APP.write_text(text, encoding="utf-8", newline="\n")

remaining = [marker for marker in markers if marker in text]
if remaining:
    raise SystemExit(f"Mojibake markers still present after repair: {remaining}")

print("App.tsx UTF-8/auth repair complete")
