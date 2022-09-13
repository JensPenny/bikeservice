create table user(
    slackuser varchar(50) primary key, 
    name text, 
    defaultKm integer, 
    werknemerNr text
    );

--with an in-progress db: alter table user add werknemerNr text