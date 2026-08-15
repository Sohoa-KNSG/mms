:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Toan bo contract chi duoc deploy vao database MMS.', 1;
GO
:r .\deploy-w0-w1.sql
GO
:r .\deploy-w2.sql
GO
:r .\deploy-w3.sql
GO
:r .\deploy-w4.sql
GO
:r .\deploy-w5.sql
GO
:r .\deploy-w6.sql
GO
:r .\deploy-w7.sql
GO
PRINT N'Da deploy contract MMS W0-W7. Hay chay tests\smoke-all.sql truoc UAT.';
GO
