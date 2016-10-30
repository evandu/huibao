Koa(1.2) handlebars templating RESTful API using MySQL, on Node.js
## Database schema

```sql

DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Inventory`;
DROP TABLE IF EXISTS `Member`;
DROP TABLE IF EXISTS `InventoryLog`;

create table User (
  UserId          integer unsigned not null auto_increment,
  Name            varchar(64) not null,
  Email           varchar(64) not null,
  FeatureCode     varchar(512),
  Password        varchar(100),
  CreateDate      dateTime  not null DEFAULT CURRENT_TIMESTAMP,
  LastUpdateDate  timestamp,
  primary key       (UserId),
  unique  key Email (Email)
) engine=InnoDB charset=utf8 auto_increment=100001;


create table Inventory (
  InventoryId    integer unsigned not null auto_increment,
  Name            varchar(20) not null,
  Num             integer unsigned not null,
  Price           integer unsigned not null,
  CreateDate      dateTime  not null DEFAULT CURRENT_TIMESTAMP,
  LastUpdateDate  timestamp,
  primary key       (InventoryId),
  unique  key Name (Name)
) engine=InnoDB charset=utf8 auto_increment=100001;



create table InventoryLog (
  LogId           integer unsigned not null auto_increment,
  InventoryId     integer unsigned not null,
  Name            varchar(20) not null,
  Num             integer unsigned not null,
  Price           integer unsigned not null,
  MemberId        integer unsigned not null,
  Operator        varchar(20) not null,
  CreateDate      dateTime  not null DEFAULT CURRENT_TIMESTAMP,
  LastUpdateDate  timestamp,
  primary key       (LogId)
) engine=InnoDB charset=utf8 auto_increment=100001;



create table Member (
  MemberId         integer unsigned not null auto_increment,
  Name             varchar(64) not null,
  Code             varchar(64) not null,
  Amount           integer unsigned not null,
  GroupType        tinyint unsigned not null,
  UserId           integer unsigned,
  Address          varchar(100),
  Mobile           varchar(20),
  DrivingPic       varchar(512),
  IDPic            varchar(512),
  PolicyPic        varchar(512),
  FeatureCode      varchar(512),
  CreateDate       dateTime  not null DEFAULT CURRENT_TIMESTAMP,
  LastUpdateDate   timestamp,
  primary key       (MemberId),
  unique  key Code (Code)
) engine=InnoDB charset=utf8 auto_increment=100001;


```
## Test data

```sql

INSERT INTO User VALUES
  (100002,'Admin','admin@user.com','$2a$12$jEG0N4wNwuc20WQxN1VzduijVnlzLgBNn2N6Uq1pNjN45VhUyNf4W',now(),now());

```
