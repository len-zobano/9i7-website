#!/bin/bash

# install prerequisites for running 9i7 backend
python3 -m pip install psycopg2-binary 
createdb 9i7-notes
psql -c "CREATE ROLE notes_user WITH LOGIN PASSWORD '9i7_notes_password'"