import * as dbTools from "./dbtools.js"

/**
 * Create or replace a user
 * @param {*} userObject 
 * @returns true if we executed the replace, false if we didn't get there
 */
export function setupUser(userObject) {
    return createOrReplaceUser(userObject);
}

function createOrReplaceUser(userObject) {
    const db = dbTools.openDb();

    db.run('REPLACE INTO user (slackuser, name, defaultKm) VALUES(?, ?, ?)', [userObject.slackUser, userObject.name, userObject.defaultKm]);
    console.log('saved user ' + JSON.stringify(userObject));
    return true;
}