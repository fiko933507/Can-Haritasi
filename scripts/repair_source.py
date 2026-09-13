from pathlib import Path

APP = Path("App.tsx")

text = APP.read_text(encoding="utf-8-sig")

# App.tsx was once read as Windows-1252 and written back as UTF-8.
# Reverse that mojibake transformation only when the known markers exist.
markers = ("Ã", "Å", "Ä", "Â", "â")
if any(marker in text for marker in markers):
    text = text.encode("cp1252").decode("utf-8")

# Keep the managed Neon Auth native e-mail flow on an absolute HTTPS callback.
# Neon Managed Auth currently only accepts http/https trusted-domain entries,
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
