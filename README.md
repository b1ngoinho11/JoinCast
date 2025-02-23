# JoinCast

## start database
Check if PostgreSQL is Running
```bash
brew services list
```
Look for postgresql in the list. If it's not running, start it with:
```bash
brew services start postgresql
```
you can check if PostgreSQL is running using:
```bash
pg_isready
```
If it's running, you'll see something like:
/tmp:5432 - accepting connections

## Backend

Install Poetry (if you don’t have it)
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Activate env
```bash
poetry env activate
source $(poetry env info --path)/bin/activate
```
run fastapi server
```
python3 backend/main.py
```

visit for api ui -> http://127.0.0.1:8000/docs#/
