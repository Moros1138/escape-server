import Database from 'better-sqlite3';

import { rm } from "node:fs/promises";

await rm("../races.db", {
    force: true,
    recursive: true,
});

const races = new Database("../races.db", { verbose: console.log });


races.exec(`CREATE TABLE IF NOT EXISTS 'races' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'color' TEXT,
    'name' TEXT,
    'map' TEXT,
    'time' INTEGER,
    'created_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

const racesToInsert = [];
const colors = [
    "Yellow",
    "Pink",
    "Cyan",
    "Black",
    "Green",
    "Purple",
    "Red",
    "Blue",    
];


const maps = [
    { id: "StageI.tmx", title: "I - Welcome to Hamster Planet!", },
    { id: "StageII.tmx", title: "II - Splitting Hairs", },
    { id: "StageIII.tmx", title: "III - The Stranger Lands", },
    { id: "StageIV.tmx", title: "IV - Jet Jet Go!", },
    { id: "StageV.tmx", title: "V - Run Run Run!", },
    { id: "StageVI.tmx", title: "VI - A Twisty Maze", },
    { id: "StageVII.tmx", title: "VII - Dunescape", },
    { id: "StageVIII.tmx", title: "VIII - Swamps of Travesty", },
    { id: "StageIX.tmx", title: "IX - Wide Chasm", },
    { id: "StageX.tmx", title: "X - Hamster Island", },
];

maps.forEach((map) =>
{
    for(let i = 0; i < 50; i++)
        {
            racesToInsert.push({
                color: colors[Math.floor(Math.random() * colors.length)],
                name: `Entry${Math.floor(Math.random() * (i * 50))}`,
                map: map.id,
                time: (Math.floor(Math.random() * (i * 50)))
            });
        }
});

racesToInsert.sort(() => Math.random() - 0.5);

let stmt = races.prepare("INSERT INTO `races` (`color`, `name`, `map`, `time`) VALUES (@color, @name, @map, @time);");

racesToInsert.forEach((race) =>
{
    stmt.run(race);
});
