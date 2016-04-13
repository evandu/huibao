## Database schema

```sql
-- Schema for ‘koa-sample-web-app-api-mysql’ app

DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `Inventory`;
DROP TABLE IF EXISTS `Member`;

create table User (
  UserId          integer unsigned not null auto_increment,
  Name            varchar(20) not null,
  Email           varchar(32) not null,
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


create table Member (
  MemberId         integer unsigned not null auto_increment,
  Name             varchar(20) ,
  Code             varchar(20) not null,
  Amount           integer unsigned not null,
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
