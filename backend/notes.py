import http.server
import socketserver
from http import HTTPStatus
import json

responseObject = {
    "id": "1",
    "version": 1,
    "metadata": {
        "text": "hello world"
    }
} 

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(HTTPStatus.OK)
        self.end_headers()
        self.wfile.write(bytes( json.dumps(responseObject), 'utf-8'))


httpd = socketserver.TCPServer(('', 8000), Handler)
httpd.serve_forever()