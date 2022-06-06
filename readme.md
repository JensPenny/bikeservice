# Features
* creates a slack-bot with following commands:  
    *  Use '/bike setup' to set up a default amount of km. Use the total (there and back)
    * Use '/bike reg or register to register a commute. Add a km amount to overwrite the default km. Add a date in yyyy-mm-dd to overwrite the date
    * Use '/bike csv' to export the data for a given month to csv. Add a date in yyyy-mm-dd to get the export for that month in particular.
    * Use '/bike help' to see the list of commands.`,


# Necessary environment variables  
export SLACK_SIGNING_SECRET=<your-signing-secret>  
export SLACK_BOT_TOKEN=<your-bot-token>: starts with xoxb  
export SLACK_APP_TOKEN=<your-app-token>  

# Docker Config
docker build . -t penny/bikeservice

docker run -e SLACK_BOT_TOKEN=<your-bot-token> \
-e SLACK_SIGNING_SECRET=<your-signing-secret> \
-e SLACK_APP_TOKEN=<your-app-token> \
-p 3000:3000 -d penny/bikeservice
