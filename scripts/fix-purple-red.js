import Database from 'better-sqlite3';

const races = new Database("../races.db", { verbose: console.log });

races.exec(`UPDATE races SET color = 'Purple' WHERE color = 'PurpleRed';`);
