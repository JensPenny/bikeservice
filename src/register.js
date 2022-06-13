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

    //#4: km can be zero for the register - step. This acts like an unregister
    if (km === undefined) {
        let result = await getResult(db, slackuser).catch((err) => { return err;}); //We have pre-defined the error, so we just pass it through
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

    let insertResult = await persistRegistration(db, slackuser, dateToRegister, km);
    db.close();
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
            if (!row) {
                return reject({
                    success: false, 
                    msg: "Use /bike setup <km> or use /bike reg <km> to register the amount of default km's", 
                    payload: undefined,
                })
            }
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