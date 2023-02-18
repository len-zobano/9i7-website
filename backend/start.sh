#!/bin/bash

# run 9i7 backend from an initialized but stopped state
pg_ctl -D /usr/local/var/postgres start
python3 notes.py