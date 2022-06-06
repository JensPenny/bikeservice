import sqlite3 from "sqlite3";
import fs from 'fs';

const dbPath = "/opt/bikeservice/service.db";  //Path for the db 

/**
 * @returns a db connection object. Don't forget to close it.
 */
 export function openDb() {
    let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error("couldn't open database :( " + err);
            return false;
        } else {
            console.log('connected to db');
        }
    });
    return db;
}

/**
 * Only initializes the database, but does not return an object of it. 
 * Call on startup to just create the db once, so we don't keep checking if a file exists.
 */
 export async function initializeDb() {
    //todo shit aint working

    let stat = await fs.promises.stat(dbPath)
        .then((stat) => {
            return stat;
        })
        .catch((err) => {
            return err;
        });

    console.log('stat = ' + JSON.stringify(stat));
    if (!stat.code) {
        console.log('DB exists');
        return;
    } else if (stat.code === 'ENOENT') {
        console.log('attempting to create db file');
        let created = await new Promise((resolve, reject) => {
            let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    console.error("couldn't create database :( " + err);
                    return reject(err);
                }
            });
            console.log('connected to db');
            return resolve(db);
        });

        if (!created) {
            console.log("exiting db initialization - couldn't create DB")
            return;
        }
        createTables(created);
    }
}

function createTables(db) {
    if (!db) {
        console.error("No DB given to create tables on");
        return "create tables failed";
    }

    const createUserTable = `create table user(
        slackuser varchar(50) primary key, 
        name text, 
        defaultKm integer
        );`;
    const createRegisteryTable = `create table registry(
        rowid integer primary key AUTOINCREMENT, 
        slackuser text, 
        registerdate date, 
        km integer
    );`;
    const createUserDateIndexOnRegistry = `create unique index registry_slackuser_date on registry(slackuser, registerdate);`;

    let duplicateError = 'already exists';
    db.serialize(() => {
        db.run(createUserTable, (err) => {
            if (err && err.message.indexOf(duplicateError) > -1) {
                console.log('User table exists');
                return;
            }
            if (err) {
                console.error('create user table err', err.message);
                return;
            }
            console.log('user table created successfully');
            return;
        })
            .run(createRegisteryTable, (err) => {
                if (err && err.message.indexOf(duplicateError) > -1) {
                    console.log('registry table exists');
                    return;
                }
                if (err) {
                    console.log('create registry table err', err.message);
                    return;
                }
                console.log('registry table created successfully');
                return;
            })
            .run(createUserDateIndexOnRegistry, (err) => {
                if (err && err.message.indexOf(duplicateError) > -1) {
                    console.log('userdate-index already exists');
                    return;
                }
                if (err) {
                    console.log('create index err', err.message);
                    return;
                }
                console.log('userdate-index created successfully');
                return;
            });
    });

    //Close db after init
    db.close();
}