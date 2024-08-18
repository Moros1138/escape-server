import 'dotenv/config';

import defineApi from "./app.js";

import express from 'express';
import morgan from 'morgan';
import { dirname,join } from "path";
import { fileURLToPath } from 'url';

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

const races = new Database("races.db", { verbose: console.log });
const sessions = new Database("sessions.db", { verbose: console.log });

races.exec(`CREATE TABLE IF NOT EXISTS 'races' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'color' TEXT,
    'name' TEXT,
    'map' TEXT,
    'time' INTEGER,
    'created_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

app.use(morgan("tiny"));

app.get("/leaderboard.html", (request, response) =>
{
    response.sendFile(join(__dirname, "public", "leaderboard.html"));
});

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

app.listen(port, () =>
{
    console.log(`Listening on http://localhost:${port}`);
});
