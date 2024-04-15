import http.server
import socketserver
from http import HTTPStatus
import json
import psycopg2

responseObject = {
    "id": 1,
    "version": 1,
    "metadata": {
        "text": "hello world"
    }
} 

types = {
    "NoteNode" : {
        # Metadata is automatically added by the framework
        # "metadata" : {
        #     # JSON does not have any other data - 
        #     # it just tells the framework to store
        #     # the object as a JSON string without the
        #     # client needing to encode it 
        #     "type" : "JSON"
        # },
        "text" : {
            "type" : "Text"
        },
        "encryption" : {
            "type" : "Text"
        }
    },
    "NoteNodeCategory" : {
        "name" : {
            "type" : "Text"
        }
    }
}

relationships = [
    [
        {  
            "type" : "NoteNode",
            "key" : "categories",
            "relationship" : "many"
        },
        {
            "type" : "NoteNodeCategory",
            "key" : "nodes",
            "relationship" : 
        }
    ],
    [
        # The first key in the relationship is the property -
        # It's what the user can edit to update both relationships
        # The other key is read-only and gives an error on update
        {
            "type" : "NoteNode",
            "key" : "parent",
            "relationship" : "one"
        },
        {
            "type" : "NoteNode",
            "key" : "children",
            "relationship" : "many"
        }
    ]
]

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(HTTPStatus.OK)
        self.end_headers()
        self.wfile.write(bytes( json.dumps(responseObject), 'utf-8'))

def transaction (command):
    print ("transaction:")
    print (command)
    return 

    httpd = socketserver.TCPServer(('', 8000), Handler)
    conn = psycopg2.connect(database = "9i7-notes", user = "notes_user", password = "9i7_notes_password", host = "127.0.0.1", port = "5432")
    print ("connected to database")
    cur = conn.cursor()
    print ("got cursor")
    cur.execute(command)
    print("executed command")
    cur.close()
    print("closd connection")
    conn.commit()
    print("committed connection")
    return

print ("starting notes server")

for typeKey, typeObject in types.items():
    #build query for creating type table
    query = "CREATE TABLE type_" + typeKey + " ("
    typeObject["metadata"] = { "type" : "JSON" }
    #if type table doesn't exist, create it
    for fieldKey, fieldObject in typeObject.items():
        if fieldObject["type"] == "JSON":
            query += fieldKey + " TEXT,"
        elif fieldObject["type"] == "Text":
            query += fieldKey + " TEXT,"
    # Valid is an indication of the validity of the object
    query += "ID UUID, valid BOOLEAN);"
    #build table for type
    transaction(query)

for relationship in relationships:
    #if "[type0]_[key0]_[type1]_[key1]" tables doesnt' exist, create it
    query = "CREATE TABLE relationship_" + relationship[0]["type"] + "_" + relationship[0]["key"] + "_" + relationship[1]["type"] + "_" + relationship[1]["key"] + " ("
    query += "from UUID, to UUID);"
    transaction(query)
    

print(conn)
httpd.serve_forever()