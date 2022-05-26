import Bolt from '@slack/bolt';


const app = new Bolt.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true, 
});

//Stuff goes here
app.command('/bike', async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();
    console.log(command);
    await respond(`${command.text}`);
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bike registration app is running!');
})();