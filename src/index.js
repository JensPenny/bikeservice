import Bolt from '@slack/bolt';
import * as UserRepo from './user.js';
import * as RegisterRepo from './register.js';


const app = new Bolt.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
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
            errormsg = "Invalid use of setup. Attach a default distance in km for your one-way commute, like '/bike setup 6'"
        } else {
            route = 'setup';
            extraparams = param.split(' ')[1]; //Get the first element after the first space
            console.log('registering user with distance ' + extraparams)
            let success = UserRepo.setupUser({
                name: command.user_name,
                slackUser: command.user_id,
                defaultKm: parseInt(extraparams),
            });

            if (!success) {
                route = 'error';
                errormsg = "Could not setup the user. Check the bot-logs, since there is something wrong with the persistence layer";
            }
        }
    } else if (param.startsWith('reg')) {
        //Regex: reg(ister)?( [0-9^-]*)?( \d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))?
        //Matches: reg or register. Optionally an amount (km). Optionally a date (registration)
        let matches = param.match(/reg(ister)?( [0-9^-]*)?( \d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))?/);

        if (!matches) {
            route = 'error';
            errormsg = `Invalid use of reg or register. Only use 'register' to register the default km today, or add an amount in km optionally, and add a date optionally.
            An example of a full command is '/bike reg 10 2022-06-01. Another example is /bike reg 2022-06-02`;
        } else {
            route = 'register';
            extraparams = param.split(' '); //array here possibly

            let kmInCommand = undefined;
            let registerDate = undefined;
            if (extraparams[1]) {
                let param = extraparams[1];
                if (param.match(/[0-9^-]/)) {
                    kmInCommand = parseInt(param);
                } else if (param.match(/(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))/)) {
                    registerDate = param;
                }
            }

            if (extraparams[2]) {
                let param = extraparams[2];
                if (param.match(/(\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))/)) {
                    registerDate = param;
                }
            }

            console.log('registering commute for user ' + command.user_id + ' km: ' + kmInCommand + " - date: " + registerDate);

            //todo: log error if possible
            let response = RegisterRepo.registerCommute(command.user_id, registerDate, kmInCommand);
            console.log(JSON.stringify(response));
            if (!response.success) {
                route = 'error';
                errormsg = response.msg;
            }
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
                text: `Your user has been set up. You can start registering commutes`,
            });
        } else if (route === 'help') {
            await respond({
                response_type: 'ephemeral',
                text: `* Use 'setup' to set up a default amount of KM. 
                * Use 'reg or register to register a commute. 
                * Use 'help' to see the list of commands.`,
            });
        } else {
            await respond({
                response_type: 'ephemeral',
                text: `This command is not recognized. 
            * Use 'setup' to set up a default amount of KM. 
            * Use 'reg or register to register a commute. 
            * Use 'help' to see the list of commands.`,
            });
        }
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bike registration app is running!');
})();