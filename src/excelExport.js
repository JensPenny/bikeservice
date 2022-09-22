import Excel from 'exceljs';
import * as CSV from './csvExport.js';
import fs from 'fs';

export async function exportAsXlsx(user, name, requestDate) {
    let month = requestDate.getMonth();
    let year = requestDate.getFullYear();
    let fullMonth = requestDate.toLocaleString('nl-BE', { month: 'long' })
    let registrations = await CSV.getPaddedRegistrations(user, month, year);
    let werknemerNrRow = await CSV.getWerknemerNrFromDb(user);

    var workbook = new Excel.Workbook();
    try {
        await workbook.xlsx.readFile('./res/Fietsvergoeding.xlsx');
        let sheet = workbook.getWorksheet(1);
        let currentRow = 17;

        if (werknemerNrRow.success) {
            sheet.getRow(12).getCell('C').value = werknemerNrRow.payload;
            sheet.getRow(12).commit();    
        }
        sheet.getRow(13).getCell('C').value = name;
        sheet.getRow(13).commit();
        sheet.getRow(14).getCell('C').value = fullMonth;
        sheet.getRow(14).commit();

        sheet.getRow(54).getCell('B').value = requestDate.toLocaleDateString('nl-BE');
        sheet.getRow(54).commit();
        for (const reg of registrations) {
            let row = sheet.getRow(currentRow);
            row.getCell('B').value = reg[0];
            row.getCell('C').value = reg[1];
            row.getCell('D').value = reg[2];
            row.commit();
            currentRow++;
        }
        workbook.calcProperties.fullCalcOnLoad = true;
        //let result = await workbook.xlsx.writeFile(`./res/${user}.xlsx`);
        let dir = `/opt/bikeservice/${user}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        let exportFileName = `${dir}/${user}-${month + 1}-${year}.xlsx`;

        await workbook.xlsx.writeFile(exportFileName,);

        return {
            success: true,
            file: exportFileName,
        }
    } catch (err) {
        console.log(`Could not open xls file: ${err}`);
        return {
            success: false,
            msg: `Error creating xls file: ${err}`,
        }
    }
}