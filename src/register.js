import * as dbTools from "./dbtools.js"

export function registerCommute(slackuser, registerdate, km) {
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
        let result = getResult(db, slackuser);
        if (!result.success) {
            return result; //Bubble the error
        }

        let defaultKm = result.payload;
        if (defaultKm === undefined) {
            return {
                success: false,
                msg: "Couldn't query default km's",
            }
        }
    }
    if (km < 3) {
        return {
            success: false,
            msg: "the amount of km registered needs to be at least 3 km's for the timesheet (don't blame me)",
        };
    }

    db.run('INSERT INTO registry (slackuser, registerdate, km) VALUES(?, ?, ?)', [slackuser, dateToRegister, km]);
    return {
        success: true,
        msg: 'inserted commute: ' + slackuser + '-' + dateToRegister + '-' + km
    };
}

//todo not working
async function getResult(db, slackuser) {
    try {
        console.log('start fetching default kms');
        const row = await db.get("SELECT defaultKm FROM user WHERE slackuser = ?", [slackuser]);
        console.log('found ' + JSON.stringify(row));
        return {
            success: true, 
            payload: parseInt(row.defaultKm),
        }
    } catch (err) {
        console.error('error q: ' + err)
        return {
            success: false,
            msg: "Couldn't query default km's: " + err,
            payload: undefined
        };
    }
}