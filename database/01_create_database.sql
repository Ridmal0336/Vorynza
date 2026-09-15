-- Vorynza — Microsoft SQL Server Express
-- In SSMS: connect to localhost\SQLEXPRESS, then run this script

IF DB_ID(N'VorynzaDB') IS NULL
BEGIN
    CREATE DATABASE VorynzaDB;
END
GO

USE VorynzaDB;
GO
