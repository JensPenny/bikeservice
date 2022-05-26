create table registry(
    rowid integer primary key AUTOINCREMENT, 
    slackuser text, 
    registerdate date, 
    km integer
);
create index registry_slackuser on registry(slackuser);