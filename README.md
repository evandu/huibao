```sql

DROP TABLE IF EXISTS Sequence;
CREATE TABLE Sequence (
         name VARCHAR(50) NOT NULL,
         current_value BIGINT NOT NULL,
         increment BIGINT NOT NULL DEFAULT 1,
         PRIMARY KEY (name)
) ENGINE=InnoDB;


DROP FUNCTION IF EXISTS CURRVAL;
DELIMITER $
 CREATE FUNCTION CURRVAL (seq_name VARCHAR(50))
          RETURNS BIGINT
          LANGUAGE SQL
          DETERMINISTIC
          CONTAINS SQL
          SQL SECURITY DEFINER
          COMMENT ''
 BEGIN
          DECLARE value BIGINT;
          SET value = 0;
          SELECT current_value INTO value
                    FROM Sequence
                    WHERE name = seq_name;
          RETURN value;
 END
 $
DELIMITER ;


DROP FUNCTION IF EXISTS NEXTVAL;
DELIMITER $
CREATE FUNCTION NEXTVAL (seq_name VARCHAR(50))
         RETURNS BIGINT
         LANGUAGE SQL
         DETERMINISTIC
         CONTAINS SQL
         SQL SECURITY DEFINER
         COMMENT ''
BEGIN
         UPDATE Sequence
                   SET current_value = current_value + increment
                   WHERE name = seq_name;
         RETURN CURRVAL(seq_name);
END
$
DELIMITER ;

DROP FUNCTION IF EXISTS SETVAL;
DELIMITER $
CREATE FUNCTION SETVAL (seq_name VARCHAR(50), value BIGINT)
            RETURNS BIGINT
            LANGUAGE SQL
            DETERMINISTIC
            CONTAINS SQL
            SQL SECURITY DEFINER
            COMMENT ''
   BEGIN
            UPDATE Sequence
                      SET current_value = value
                      WHERE name = seq_name;
            RETURN CURRVAL(seq_name);
   END
$
DELIMITER ;


INSERT INTO Sequence VALUES ('FeatureCode',10000, 1);
```