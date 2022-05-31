import * as dbTools from "./dbtools.js"

export async function exportAsCsv(slackuser, month, year) {
    try {
        let rows = await getFromDb(slackuser);

        console.log(`found rows ${JSON.stringify(rows)}`);

        //let registrations = rows.map(({registerdate, km}) => {registerdate, km}); //I wouldn't know why destructuring like this wouldnt work
        let registrations = rows.map((row) => {
            console.log(JSON.stringify(row));
            return (({ registerdate, km }) => ([new Date(registerdate), km]))(row); //...but this shit does
        });
        //console.log(`mapped regs${JSON.stringify(registrations)}`);

        let startDate = new Date(year, month, 1);
        let endDate = new Date(year, month, 1);
        endDate.setMonth(endDate.getMonth() + 1);
        let filtered = registrations
            .filter(reg => { return reg[0] >= startDate && reg[0] < endDate; })
            .map((row) => ([row[0].getDate(), 'woon-werk', row[1]])); //Map to only day + kms

        //console.log(`filtered rows ${JSON.stringify(filtered)}`);

        //Fill 31 days for a zero-based csv export
        let fullExportable = [];
        for (let day = 1; day <= 31; day++){
            fullExportable.push([day, '', 0]);
        }

        //Fill the registered days in the empty days
        filtered.forEach(registration => {
            console.log(registration);
            fullExportable[registration[0] - 1] = registration;
        });
        //console.log(`fully exportable csv: ${JSON.stringify(fullExportable)}`);

        let csv = fullExportable.map(item => item.join(','))
            .join('\n');

        console.log('csv: ' + csv);
        return csv;
    } catch (err) {
        console.error(err);
        return '';
    }
}

async function getFromDb(slackuser) {
    const db = dbTools.openDb();
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM registry WHERE slackuser = ?", [slackuser], (err, rows) => {
            if (err) {
                return reject(err);
            };
            return resolve(rows);
        });
    });
}