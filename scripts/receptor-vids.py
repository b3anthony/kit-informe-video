# Receptor local para las voces de Google Vids (motor_voz "manual"): la pestaña de Vids hace POST /<id>.wav y se guarda en la carpeta.
# Uso:  python scripts/receptor-vids.py informes/<semana>/<integrante>/voces     (déjalo corriendo mientras generas las frases)
# La primera vez Chrome pregunta si docs.google.com puede acceder a la «red local»: acepta.
import http.server, os, re, sys
DEST = sys.argv[1]
os.makedirs(DEST, exist_ok=True)
print("Esperando audios en", DEST, "(Ctrl+C para salir)", flush=True)
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', 'https://docs.google.com')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        nombre = re.sub(r'[^\w.-]', '_', self.path.strip('/')) or 'audio.bin'
        datos = self.rfile.read(int(self.headers['Content-Length']))
        with open(os.path.join(DEST, nombre), 'wb') as f: f.write(datos)
        print('guardado', nombre, len(datos), flush=True)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')
http.server.HTTPServer(('127.0.0.1', 8765), H).serve_forever()
