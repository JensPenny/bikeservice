# Features
* creates a slack-bot with following commands:  
    * Use '/bike setup' to set up a default amount of km. Use the total (there and back)
    * Use '/bike reg or register to register a commute. Add a km amount to overwrite the default km. Add a date in yyyy-mm-dd to overwrite the date
    * Use '/bike csv' to export the data for a given month to csv. Add a date in yyyy-mm-dd to get the export for that month in particular.
    * use '/bike xls' to export the data to an excel - file. You'll have to provide the template yourself. 
    * Use '/bike help' to see the list of commands.`,

# Required slack permissions
* chat:write    -   to be able to send messaged to users as bikebot
* commands      -   to be able to receive the /bike - commands we listen on
* files:write   -   to write excel-files. If you remove the xls-command you won't need this

# Necessary environment variables  
export SLACK_SIGNING_SECRET=<your-signing-secret>  
export SLACK_BOT_TOKEN=<your-bot-token>: starts with xoxb  
export SLACK_APP_TOKEN=<your-app-token>

# For local testing
The database itself gets stored under /opt/bikeservice. This is so you can swap out the volume on the container with ease. 
For local testing you probably don't have root under /opt/. Just create the folder and give your local user rights to this folder.  

sudo mkdir /opt/bikeservice  
sudo chown -R $USER:$USER /opt/bikeservice  

# Docker Config
docker build . -t penny/bikeservice

docker run -e SLACK_BOT_TOKEN=<your-bot-token> \
-e SLACK_SIGNING_SECRET=<your-signing-secret> \
-e SLACK_APP_TOKEN=<your-app-token> \
-p 3000:3000 -d penny/bikeservice
