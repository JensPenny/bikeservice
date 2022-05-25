create table registry(
    rowid identity primary key, 
    userid integer, 
    registerdate date, 
    km integer
);
create index registry_userid on registry(userid);