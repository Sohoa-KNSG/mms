:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Smoke test chi duoc chay tren database MMS.', 1;
GO
:r .\tests\w0_w1_contract_smoke.sql
GO
:r .\tests\w2_contract_smoke.sql
GO
:r .\tests\w3_contract_smoke.sql
GO
:r .\tests\w4_contract_smoke.sql
GO
:r .\tests\w5_contract_smoke.sql
GO
:r .\tests\w6_contract_smoke.sql
GO
:r .\tests\w7_contract_smoke.sql
GO
SELECT SmokeStatus = N'PASS', CheckedAt = GETDATE();
GO
