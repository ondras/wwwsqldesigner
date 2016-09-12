DROP TABLE IF EXISTS `wwwsqldesigner`;

CREATE TABLE `wwwsqldesigner` (
  `keyword` varchar(30) NOT NULL default '',
  `data` mediumtext,
  `dt` timestamp,
  PRIMARY KEY  (`keyword`)
);
