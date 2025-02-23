## setup Project with Poetry

# Install Poetry (if you don’t have it)
```bash
pip install poetry
```

```bash
poetry env activate
source $(poetry env info --path)/bin/activate
# poetry install 
```

# run fastapi server
```bash
poetry run uvicorn main:app --reload
```

# to list all the dependencies
```bash
poetry show
```

# start database
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

test the connection to the database
```bash
psql -h localhost -U postgres -d appdb
```
to see the tables
```bash
\dt
```
to delete the table
```
drop table users;
```
