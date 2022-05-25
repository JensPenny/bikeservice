create table user(
    id identity primary key, 
    slackuser text, 
    name text, 
    defaultKm integer
    );
create unique index user_slack on user(slackuser);