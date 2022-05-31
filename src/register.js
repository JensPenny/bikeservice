import * as dbTools from "./dbtools.js"

export async function registerCommute(slackuser, registerdate, km) {
    if (!slackuser) {
        return {
            success: false,
            msg: 'cannot find a user to register the commute for',
        };
    }
    let dateToRegister = registerdate;
    if (!dateToRegister) {
        let today = new Date().toISOString().slice(0, 10);
        dateToRegister = today; //Redundant but clear imo
    }

    const db = dbTools.openDb();
    if (!km) {
        console.log('before result');
        let result = await getResult(db, slackuser);
        console.log('after result' + JSON.stringify(result));
        if (!result.success) {
            return result; //Bubble the error
        }

        let defaultKm = result.payload;
        if (defaultKm === undefined) {
            return {
                success: false,
                msg: "Couldn't query default km's",
            }
        } else {
            km = defaultKm;
        }
    }
    if (km < 3) {
        return {
            success: false,
            msg: "the amount of km registered needs to be at least 3 km's for the timesheet (don't blame me)",
        };
    }

    let insertResult = await persistRegistration(db, slackuser, dateToRegister, km);
    console.log('Inserted: ' + JSON.stringify(insertResult));
    return insertResult;
}

/**
 * select the km's associated with the user
 */
async function getResult(db, slackuser) {
    return new Promise((resolve, reject) => {
        db.get("SELECT defaultKm FROM user WHERE slackuser = ?", [slackuser], (err, row) => {
            if (err) {
                return reject({
                    success: false,
                    msg: "Couldn't query default km's: " + err,
                    payload: undefined,        
                });
            };
            console.log('resolving ' + row.defaultKm);
            return resolve({
                success: true, 
                payload: parseInt(row.defaultKm),    
            });
        });
    });
}

/**
 * Persist the registration for a given user
 */
async function persistRegistration(db, slackuser, dateToRegister, km) {
    return new Promise((resolve, reject) => {
        db.run('REPLACE INTO registry (slackuser, registerdate, km) VALUES(?, ?, ?)', [slackuser, dateToRegister, km], (err, row) => {
            if (err) {
                return reject({err});
            } else {
                return resolve({
                    success: true,
                    msg: `User ${slackuser} registered a commute for ${km} km on ${dateToRegister}`,               
                })
            }
        });
    })
}