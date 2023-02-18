import http.server
import socketserver
from http import HTTPStatus
import json
import psycopg2

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


print ("starting notes server")
httpd = socketserver.TCPServer(('', 8000), Handler)
conn = psycopg2.connect(database = "9i7-notes", user = "notes_user", password = "9i7_notes_password", host = "127.0.0.1", port = "5432")
print ("connected to database")
print(conn)
httpd.serve_forever()