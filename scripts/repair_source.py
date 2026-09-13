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
if "  NEON_AUTH_URL,\n" not in text:
    text = text.replace("  NearbyReport,\n", "  NearbyReport,\n  NEON_AUTH_URL,\n", 1)

literal = "'https://ep-red-lake-ayk3kz85.neonauth.c-5.us-east-2.aws.neon.tech/canharitasi/auth'"
text = text.replace(f"callbackURL: {literal}", "callbackURL: NEON_AUTH_URL")

# Do not initialize the MapLibre JS/native module while the user is still on auth/startup.
# This keeps startup isolated from the heaviest native dependency and lets us diagnose
# map-specific failures separately.
text = text.replace(
    "import { Map as MapLibreMap, Camera, Marker } from '@maplibre/maplibre-react-native';\n",
    "",
)

backend_end = "} from './src/backend';\n"
if "declare const require: (moduleName: string) => any;" not in text:
    text = text.replace(
        backend_end,
        backend_end + "\ndeclare const require: (moduleName: string) => any;\n",
        1,
    )

map_signature = "function MapScreen({ reports, position, onHelp, onModerated }: { reports: NearbyReport[]; position: Position | null; onHelp: (id: string) => Promise<void>; onModerated: () => Promise<void> }) {\n"
map_lazy = (
    map_signature
    + "  const { Map: MapLibreMap, Camera, Marker } = require('@maplibre/maplibre-react-native') as typeof import('@maplibre/maplibre-react-native');\n"
)
if map_signature in text and "require('@maplibre/maplibre-react-native')" not in text:
    text = text.replace(map_signature, map_lazy, 1)

# Catch React render/lifecycle startup errors and show the actual message on-device instead
# of allowing a generic Android 'app stopped' dialog.
if "class AppErrorBoundary" not in text:
    boundary = """
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { error: message };
  }

  componentDidCatch(error: unknown) {
    console.error('Can Haritası startup/render error', error);
  }

  render() {
    if (this.state.error) {
      return <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F5EF', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#153F36', fontSize: 24, fontWeight: '900', marginBottom: 12 }}>Can Haritası açılamadı</Text>
        <Text style={{ color: '#5F6C67', fontSize: 14, lineHeight: 21, marginBottom: 16 }}>Başlangıçta bir uygulama hatası yakalandı. Aşağıdaki metni bize gönder.</Text>
        <Text selectable style={{ color: '#7A2E22', fontSize: 12, lineHeight: 18 }}>{this.state.error}</Text>
      </SafeAreaView>;
    }
    return this.props.children;
  }
}

"""
    text = text.replace("function AppInner() {\n", boundary + "function AppInner() {\n", 1)

text = text.replace(
    "export default function App() { return <SafeAreaProvider><AppInner /></SafeAreaProvider>; }",
    "export default function App() { return <SafeAreaProvider><AppErrorBoundary><AppInner /></AppErrorBoundary></SafeAreaProvider>; }",
)

APP.write_text(text, encoding="utf-8", newline="\n")

remaining = [marker for marker in markers if marker in text]
if remaining:
    raise SystemExit(f"Mojibake markers still present after repair: {remaining}")

if "import { Map as MapLibreMap" in text:
    raise SystemExit("MapLibre still imports eagerly at startup")
if "class AppErrorBoundary" not in text:
    raise SystemExit("Startup error boundary was not injected")

print("App.tsx UTF-8/auth/startup hardening complete")
