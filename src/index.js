import Bolt from '@slack/bolt';
import * as UserRepo from './user.js';
import * as RegisterRepo from './register.js';
import * as CSV from './csvExport.js';
import * as XLS from './excelExport.js';
import { initializeDb } from './dbtools.js';
import fs from 'fs';

const commandText = `* Use 'setup' to set up a default amount of km. Use the total (there and back)
* Use 'reg or register to register a commute. Add a km amount to overwrite the default km. Add a date in yyyy-mm-dd to overwrite the date
* Use 'csv' to export the data for a given month to csv. Add a date in yyyy-mm-dd to get the export for that month in particular.
* Use 'xls' to export the data for a given month to excel. Add a date in yyyy-mm-dd to get the export for that month. Bikebot will send the file to you.
* Use 'help' to see the list of commands.`

const app = new Bolt.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    //Specific error handlers
    dispatchErrorHandler: ({ error, logger, response }) => {
        logger.error(`dispatch error: ${error}`);
        response.writeHead(404);
        response.write("Path not found");
        response.end();
    },
    processEventErrorHandler: ({ error, logger, response }) => {
        logger.error(`Uncaught error: ${error}`);
        // acknowledge it anyway!
        response.writeHead(200);
        response.end();
        return true;
    },
    unhandledRequestHandler: async ({ logger, response }) => {
        logger.info('The service did not respond to your request in 2 seconds. Aborting request...');
        // acknowledge it anyway!
        response.writeHead(200);
        response.end();
    },

});

//Stuff goes here
app.command('/bike', async ({ command, ack, respond }) => {
    await ack();

    const param = command.text;

    let route = '';
    let extraparams = '';
    let errormsg = '';
    if (param.startsWith('setup')) {
        let matches = param.match(/setup [0-9]+/);

        if (!matches) {
            route = 'error';
            errormsg = "Invalid use of setup. Attach a default distance in km for your two-way commute, like '/bike setup 6'"
        } else {
            route = 'setup';
            extraparams = param.split(' ')[1]; //Get the first element after the first space

            let km = parseInt(extraparams);
            let success = false;
            if (km < 3) {
                console.log(`couldn't register user ${command.user_name} with default ${km} km`)
                route = 'error';
                errormsg = "the amount of km registered needs to be at least 3 km's for the timesheet (don't blame me)";
            } else {
                console.log('registering user with distance ' + extraparams);
                success = UserRepo.setupUser({
                    name: command.user_name,
                    slackUser: command.user_id,
                    defaultKm: km,
                });   
                
                if (!success) {
                    route = 'error';
                    errormsg = "Could not setup the user. Check the bot-logs, since there is something wrong with the persistence layer";
                }    
            }
        }
    } else if (param.startsWith('reg')) {
        //Regex: reg(ister)?( [0-9^-]*)?( \d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))?
        //Matches: reg or register. Optionally an amount (km). Optionally a date (registration)
        let regexKm = /(\s[0-9]+(\s|$))/; //space<number>space-or-endline regex for amount of kms
        let regexDate = /(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))/; //yyyy-mm-dd

        route = 'register';

        let kmMatches = param.match(regexKm);
        let kmAsParam = undefined;
        if (kmMatches) {
            console.log(`found km: ${kmMatches}`)
            kmAsParam = parseInt(kmMatches[0]);
        }

        let registerDateMatches = param.match(regexDate);
        let registerDateAsParam = undefined;
        if (registerDateMatches) {
            console.log(`found date: ${registerDateMatches}`)
            registerDateAsParam = registerDateMatches[0];
        }

        let response = await RegisterRepo.registerCommute(command.user_id, registerDateAsParam, kmAsParam);
        if (!response.success) {
            route = 'error';
            errormsg = response.msg;
        } else {
            errormsg = response.msg; //abuse the errormsg as a normal msg
        }
    } else if (param.startsWith('csv')) {
        extraparams = param.split(' ')[1]; //Get the first element after the first space

        let requestDate = undefined;
        if (extraparams) {
            if (param.match(/(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))/)) {
                requestDate = new Date(param);
            }
        }

        if (!requestDate) {
            requestDate = new Date();
        }

        let month = requestDate.getMonth(); //may in normal-people-speak
        let year = requestDate.getFullYear();
        let csv = await CSV.exportAsCsv(command.user_id, month, year); //Month starts at 0 - js sucks

        if (!csv || csv == '') {
            route = 'error';
            errormsg = 'could not find anything to export';
        } else {
            route = 'csv';
            errormsg = csv;
        }
    } else if (param.startsWith('xls')) {
        extraparams = param.split(' ')[1]; //Get the first element after the first space

        let requestDate = undefined;
        if (extraparams) {
            if (param.match(/(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))/)) {
                requestDate = new Date(param);
            }
        }

        if (!requestDate) {
            requestDate = new Date();
        }

        //Fetch full user
        let user = await app.client.users.profile.get({user: command.user_id});
        var userFullName = user.profile.real_name;

        let xlsResult = await XLS.exportAsXlsx(command.user_id, userFullName, requestDate); //Month starts at 0 - js sucks
        if (xlsResult.success) {
            let filepath = xlsResult.file;
            try {
                let uploaded = await app.client.files.upload({
                    channels: command.user_id,
                    file: fs.createReadStream(filepath),
                    title: `your xls export for ${requestDate}`,
                    filename: filepath, 
                    filetype: 'xlsx',
                });
            } catch (err) {
                route = 'error';
                errormsg = err.message;
            }

            route = 'xls';
        } else {
            route = 'error';
            errormsg = xlsResult.msg;
        }

    } else if (param.startsWith('help')) {
        route = 'help';
    }

    if (route === 'error') {
        console.log('found error: ' + errormsg);
        await respond({
            response_type: 'ephemeral',
            icon_emoji: ':red_cross:',
            text: errormsg,
        })
    } else {
        if (route === 'setup') {
            await respond({
                response_type: 'ephemeral',
                text: `Your user has been set up. You can start registering commutes`,
            });
        } else if (route === 'register') {
            await respond({
                response_type: 'ephemeral',
                text: `You have registered a commute: ${errormsg}`,
            });
        } else if (route === 'help') {
            await respond({
                response_type: 'ephemeral',
                text: commandText,
            });
        } else if (route == 'csv') {
            await respond({
                response_type: 'ephemeral',
                text: `\`\`\`${errormsg}\`\`\``, //Respond with the csv in a code block
            })
        } else if (route == 'xls') {
            await respond({
                response_type: 'ephemeral', 
                text: 'We have sent the file in a direct message',
            })
        } else {
            await respond({
                response_type: 'ephemeral',
                text: `This command is not recognized.\n${commandText}`,
            });
        }
    }
});

(async () => {
    // Start your app
    await initializeDb();
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bike registration app is running!');
})();