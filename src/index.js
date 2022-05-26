import Bolt from '@slack/bolt';
import * as UserRepo from './user.js';


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
        console.log(matches);
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

            if (!success){
                route = 'error';
                errormsg = "Could not setup the user. Check the bot-logs, since there is something wrong with the persistence layer";
            }
        }
    }

    if (route === 'error') {
        console.log('found error: ' + errormsg );
        await respond({
            response_type: 'ephemeral', 
            icon_emoji: ':red_cross:', 
            text: errormsg,
        })
        
    } else {
        await respond({
            response_type: 'ephemeral',
            text: `${command.text}`,
        });
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bike registration app is running!');
})();