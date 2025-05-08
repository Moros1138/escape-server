import 'dotenv/config';

import defineApi from "./app.js";

import express from 'express';
import morgan from 'morgan';
import { dirname,join } from "path";
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname       = dirname(fileURLToPath(import.meta.url));
const port            = process.env.PORT || "3000";
const publicDirectory = process.env.PUBLIC_DIRECTORY || "public";
const sessionName     = process.env.SESSION_NAME   || "sessionid";
const sessionSecret   = process.env.SESSION_SECRET || "totally-a-secret";
const isProduction    = (process.env.NODE_ENV === "production");

import Database from 'better-sqlite3';
import session from 'express-session';
import store from 'better-sqlite3-session-store';

const app = express();

const SqliteStore = store(session);

const dbExists = (existsSync("races.db"));
const races = new Database("races.db", { verbose: console.log });
const sessions = new Database("sessions.db", { verbose: console.log });

races.exec(`CREATE TABLE IF NOT EXISTS 'races' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'name' TEXT,
    'mode' TEXT,
    'time' INTEGER,
    'created_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

races.exec(`CREATE TABLE IF NOT EXISTS 'counters' (
    'mode' TEXT,
    'count' INTEGER
)`);

if(!dbExists)
{
    races.exec(`INSERT INTO counters (mode, count) VALUES ('normal-main', 0);`);
    races.exec(`INSERT INTO counters (mode, count) VALUES ('encore-main', 0);`);
    races.exec(`INSERT INTO counters (mode, count) VALUES ('normal-survival', 0);`);
    races.exec(`INSERT INTO counters (mode, count) VALUES ('encore-survival', 0);`);
    
    let stmt = races.prepare("INSERT INTO `races` (`name`, `mode`, `time`) VALUES (@name, @mode, @time);");
    for(let i = 0; i < 10; i++)
    {
        stmt.run({ name: "MACHINE", mode: "normal", time: 5999999 });
        stmt.run({ name: "MACHINE", mode: "encore", time: 5999999 });
    }
}

app.use(morgan("tiny"));

app.use(express.static("public"));

if(publicDirectory !== "public")
    app.use(express.static(publicDirectory));

app.use(express.json());

const sessionConfig = {
    name: sessionName,
    store: new SqliteStore({
        client: sessions, 
        expired: {
            clear: true,
            intervalMs: 900000 //ms = 15 minutes
        }
    }),
    saveUninitialized: false,
    secret: sessionSecret,
    resave: false,
    cookie: {
        sameSite: "strict"
    }
};

if(isProduction)
{
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

defineApi(app, races);

app.get('/stats', (request, response) =>
{
    if(!request.session.userId)
    {
        response
            .set("Content-Type", "text/html")
            .status(401)
            .send(`<html><head><title>Unauthorized</title></head><body><center><h1>Unauthorized</h1><p>You do not have the rights to see this content.</p></center></body></html>`);

        return;
    }

    let results = null;
    try
    {
        const stmt = races.prepare(`SELECT * FROM counters;`);
        results = stmt.all();
    }
    catch(e)
    {
        response.status(404)
            .set("Content-Type", "text/html")
            .send(`<html><head><title>Not Found</title></head><body><center><h1>Not Found</h1><p>The content you are looking for can not be found at the location you specified.</p></center></body></html>`);

        return;
    }    
    let pageContent = `<html><head><title>Stats | Escape the Machine</title></head><body><h1>Completion Counters</h1>{{ results }}</body></html>`;
    let resultsContent = ``;

    results.forEach((result) =>
    {
        resultsContent += `<p>${result.mode}: ${result.count}</p>`;
    });

    pageContent = pageContent.replace('{{ results }}', resultsContent);

    response.status(200)
        .set("Content-Type", "text/html")
        .send(pageContent);
});

app.listen(port, () =>
{
    console.log(`Listening on http://localhost:${port}`);
});
