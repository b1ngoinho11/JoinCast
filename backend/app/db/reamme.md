to see the database schema, run the following command:

```
psql -U postgres -d app_db
\d
exit
```



if updated the database schema, run the following command to apply the changes:

example:
drop the table users
```
psql -U postgres -d app_db -c "DROP TABLE IF EXISTS users CASCADE;"
```
or
```
psql -U postgres -d app_db -c "DROP TABLE IF EXISTS users, shows, episodes, live_speakers, live_listeners, live_speaker_requests CASCADE;"
```

then rerun the app to create the all table again
```
python3 backend/main.py
```