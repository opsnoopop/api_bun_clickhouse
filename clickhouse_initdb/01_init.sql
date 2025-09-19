-- 01_init.sql

-- 1) สร้าง Database (ไม่มี charset/collation เหมือน MySQL)
CREATE DATABASE IF NOT EXISTS testdb;

-- 2) สร้างตาราง users
CREATE TABLE IF NOT EXISTS testdb.users
(
  user_id UUID DEFAULT generateUUIDv4(),
  username  String,
  email     String,
  created_at DateTime DEFAULT now()
)
ENGINE = MergeTree
ORDER BY user_id;

-- 3) ตัวอย่าง Insert (ปล่อยให้ user_id/created_at เติมเองจาก DEFAULT)
INSERT INTO testdb.users (user_id, username, email)
VALUES ('74bb5d3a-2266-4ca6-b92b-4cc3fbe9f2e4', 'optest', 'opsnoopop@hotmail.com');
