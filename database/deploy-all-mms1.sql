:on error exit
USE [MMS1];
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
:r .\deploy-react-permissions.sql
GO
PRINT N'Da deploy toan bo 79 Stored Procedures va he thong phan quyen moi vao MMS1 thanh cong!';
GO
