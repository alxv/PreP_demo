import os
from flask import Flask, send_from_directory, jsonify

# Serve existing folder structure without moving files
# - /            -> index.html (at repo root)
# - /assets/...  -> files in ./assets

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INDEX_DIR = BASE_DIR
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

app = Flask(
    __name__,
    static_folder=ASSETS_DIR,        # so url_for('static', filename='...') would work if used
    static_url_path='/assets'
)

@app.after_request
def add_headers(resp):
    # Helpful dev headers; keep simple, no caching during local dev
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['X-Content-Type-Options'] = 'nosniff'
    return resp

@app.route('/')
def root():
    return send_from_directory(INDEX_DIR, 'index.html')

@app.route('/index.html')
def index_html():
    return send_from_directory(INDEX_DIR, 'index.html')

@app.route('/assets/<path:path>')
def assets(path):
    return send_from_directory(ASSETS_DIR, path)

@app.route('/health')
def health():
    return jsonify(status='ok')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
