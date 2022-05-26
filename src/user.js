import sqlite3 from "sqlite3";

/**
 * Create or replace a user
 * @param {*} userObject 
 * @returns true if we executed the replace, false if we didn't get there
 */
export function setupUser(userObject) {
    return createOrReplaceUser(userObject);
}

function createOrReplaceUser(userObject) {
    const db = new sqlite3.Database("db.sqlite", sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error("couldn't open database :( " + err);
            return false;
        } else {
            console.log('connected to db');
        }
    });

    db.run('REPLACE INTO user (slackuser, name, defaultKm) VALUES(?, ?, ?)', [userObject.slackUser, userObject.name, userObject.defaultKm]);
    console.log('saved user ' + JSON. stringify(userObject));
    return true;
}