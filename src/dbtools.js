import sqlite3 from "sqlite3";

export function openDb() {
    let db = new sqlite3.Database("db.sqlite", sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error("couldn't open database :( " + err);
            return false;
        } else {
            console.log('connected to db');
        }
    });
    return db;
}