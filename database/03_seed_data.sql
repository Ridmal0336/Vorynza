/* ============================================================
   VORYNZA DATABASE
   FULL DATABASE SETUP
   SQL SERVER
   ============================================================ */


/* ============================================================
   STEP 1 - SELECT DATABASE
   ============================================================ */

USE VorynzaDB;
GO


/* ============================================================
   STEP 2 - CONFIRM BEFORE DROPPING TABLES
   ============================================================ */

-- !!! WARNING !!!
-- The following section will DELETE all existing data
-- from the Vorynza tables.
--
-- If you want to completely reset the database,
-- run the DROP section below.
--
-- If you DO NOT want to delete existing data,
-- DO NOT RUN THE DROP SECTION.


/* ============================================================
   STEP 3 - DROP EXISTING TABLES
   ============================================================ */

IF OBJECT_ID(N'dbo.Invoices', N'U') IS NOT NULL
    DROP TABLE dbo.Invoices;

IF OBJECT_ID(N'dbo.Reservations', N'U') IS NOT NULL
    DROP TABLE dbo.Reservations;

IF OBJECT_ID(N'dbo.MenuItems', N'U') IS NOT NULL
    DROP TABLE dbo.MenuItems;

IF OBJECT_ID(N'dbo.CateringPackages', N'U') IS NOT NULL
    DROP TABLE dbo.CateringPackages;

IF OBJECT_ID(N'dbo.Halls', N'U') IS NOT NULL
    DROP TABLE dbo.Halls;

IF OBJECT_ID(N'dbo.WeddingPackages', N'U') IS NOT NULL
    DROP TABLE dbo.WeddingPackages;

IF OBJECT_ID(N'dbo.Hotels', N'U') IS NOT NULL
    DROP TABLE dbo.Hotels;

IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
    DROP TABLE dbo.Users;

GO


/* ============================================================
   STEP 4 - CREATE USERS TABLE
   ============================================================ */

CREATE TABLE dbo.Users
(
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,

    full_name       NVARCHAR(120) NOT NULL,

    email           NVARCHAR(180) NOT NULL UNIQUE,

    password_hash   NVARCHAR(255) NOT NULL,

    phone           NVARCHAR(30) NULL,

    address         NVARCHAR(255) NULL,

    role            NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Users_Role DEFAULT ('CUSTOMER'),

    is_active       BIT NOT NULL
        CONSTRAINT DF_Users_Active DEFAULT (1),

    created_at      DATETIME2 NOT NULL
        CONSTRAINT DF_Users_Created DEFAULT (SYSUTCDATETIME())
);

GO


/* ============================================================
   STEP 5 - CREATE HOTELS TABLE
   ============================================================ */

CREATE TABLE dbo.Hotels
(
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,

    name            NVARCHAR(150) NOT NULL,

    location        NVARCHAR(150) NOT NULL,

    description     NVARCHAR(MAX) NULL,

    contact         NVARCHAR(80) NULL
);

GO


/* ============================================================
   STEP 6 - CREATE WEDDING PACKAGES TABLE
   ============================================================ */

CREATE TABLE dbo.WeddingPackages
(
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,

    hotel_id            BIGINT NOT NULL,

    name                NVARCHAR(150) NOT NULL,

    price               DECIMAL(12,2) NOT NULL,

    inclusions          NVARCHAR(MAX) NOT NULL,

    description         NVARCHAR(MAX) NULL,

    package_type        NVARCHAR(80) NULL,

    image_url            NVARCHAR(500) NULL,

    discount_percent    DECIMAL(5,2) NOT NULL
        CONSTRAINT DF_Pkg_Discount DEFAULT (0),

    is_featured         BIT NOT NULL
        CONSTRAINT DF_Pkg_Featured DEFAULT (0),

    is_active           BIT NOT NULL
        CONSTRAINT DF_Pkg_Active DEFAULT (1),

    CONSTRAINT FK_WeddingPackages_Hotel
        FOREIGN KEY (hotel_id)
        REFERENCES dbo.Hotels(id)
);

GO


/* ============================================================
   STEP 7 - CREATE HALLS TABLE
   ============================================================ */

CREATE TABLE dbo.Halls
(
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,

    hotel_id            BIGINT NOT NULL,

    name                NVARCHAR(150) NOT NULL,

    capacity            INT NOT NULL,

    decoration_theme    NVARCHAR(120) NULL,

    price               DECIMAL(12,2) NOT NULL,

    image_urls          NVARCHAR(MAX) NULL,

    average_rating      DECIMAL(3,2) NULL,

    is_active            BIT NOT NULL
        CONSTRAINT DF_Halls_Active DEFAULT (1),

    CONSTRAINT FK_Halls_Hotel
        FOREIGN KEY (hotel_id)
        REFERENCES dbo.Hotels(id),

    CONSTRAINT CK_Halls_Capacity
        CHECK (capacity > 0),

    CONSTRAINT CK_Halls_Price
        CHECK (price >= 0)
);

GO


/* ============================================================
   STEP 8 - CREATE CATERING PACKAGES TABLE
   ============================================================ */

CREATE TABLE dbo.CateringPackages
(
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,

    name            NVARCHAR(150) NOT NULL,

    category        NVARCHAR(80) NOT NULL,

    price           DECIMAL(12,2) NOT NULL,

    description     NVARCHAR(MAX) NULL,

    is_vegetarian   BIT NOT NULL
        CONSTRAINT DF_CatPkg_Veg DEFAULT (0),

    is_active       BIT NOT NULL
        CONSTRAINT DF_CatPkg_Active DEFAULT (1)
);

GO


/* ============================================================
   STEP 9 - CREATE MENU ITEMS TABLE
   ============================================================ */

CREATE TABLE dbo.MenuItems
(
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,

    name                    NVARCHAR(150) NOT NULL,

    category                NVARCHAR(80) NOT NULL,

    price                   DECIMAL(12,2) NOT NULL,

    description             NVARCHAR(MAX) NULL,

    is_vegetarian           BIT NOT NULL
        CONSTRAINT DF_Menu_Veg DEFAULT (0),

    catering_package_id     BIGINT NULL,

    is_active               BIT NOT NULL
        CONSTRAINT DF_Menu_Active DEFAULT (1),

    CONSTRAINT FK_MenuItems_Catering
        FOREIGN KEY (catering_package_id)
        REFERENCES dbo.CateringPackages(id),

    CONSTRAINT CK_Menu_Price
        CHECK (price > 0)
);

GO


/* ============================================================
   STEP 10 - CREATE RESERVATIONS TABLE
   ============================================================ */

CREATE TABLE dbo.Reservations
(
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,

    user_id         BIGINT NOT NULL,

    hall_id         BIGINT NOT NULL,

    package_id      BIGINT NOT NULL,

    event_date      DATE NOT NULL,

    guest_count     INT NOT NULL,

    status          NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Res_Status DEFAULT ('PENDING'),

    notes           NVARCHAR(500) NULL,

    created_at      DATETIME2 NOT NULL
        CONSTRAINT DF_Res_Created DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_Reservations_User
        FOREIGN KEY (user_id)
        REFERENCES dbo.Users(id),

    CONSTRAINT FK_Reservations_Hall
        FOREIGN KEY (hall_id)
        REFERENCES dbo.Halls(id),

    CONSTRAINT FK_Reservations_Package
        FOREIGN KEY (package_id)
        REFERENCES dbo.WeddingPackages(id),

    CONSTRAINT CK_Res_Guests
        CHECK (guest_count > 0)
);

GO


/* ============================================================
   STEP 11 - PREVENT DOUBLE BOOKING
   ============================================================ */

CREATE UNIQUE INDEX UX_Reservations_Hall_Date_Active
ON dbo.Reservations(hall_id, event_date)
WHERE status <> 'CANCELLED';

GO


/* ============================================================
   STEP 12 - CREATE INVOICES TABLE
   ============================================================ */

CREATE TABLE dbo.Invoices
(
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,

    reservation_id  BIGINT NOT NULL,

    amount          DECIMAL(12,2) NOT NULL,

    paid_amount     DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_Inv_Paid DEFAULT (0),

    status          NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Inv_Status DEFAULT ('UNPAID'),

    payment_method  NVARCHAR(50) NULL,

    paid_at         DATETIME2 NULL,

    created_at      DATETIME2 NOT NULL
        CONSTRAINT DF_Inv_Created DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_Invoices_Reservation
        FOREIGN KEY (reservation_id)
        REFERENCES dbo.Reservations(id),

    CONSTRAINT CK_Inv_Amount
        CHECK (amount > 0),

    CONSTRAINT CK_Inv_Paid
        CHECK (paid_amount >= 0)
);

GO


/* ============================================================
   ============================================================
   DUMMY DATA
   ============================================================
   ============================================================ */


/* ============================================================
   13 - USERS DATA
   ============================================================ */

INSERT INTO dbo.Users
(
    full_name,
    email,
    password_hash,
    phone,
    address,
    role,
    is_active
)
VALUES
(
    'Kavindu Perera',
    'kavindu@gmail.com',
    'hashed_password_001',
    '0771234567',
    'Colombo 05',
    'CUSTOMER',
    1
),
(
    'Tharushi Fernando',
    'tharushi@gmail.com',
    'hashed_password_002',
    '0712345678',
    'Nugegoda',
    'CUSTOMER',
    1
),
(
    'Ravindu Silva',
    'ravindu@gmail.com',
    'hashed_password_003',
    '0763456789',
    'Dehiwala',
    'CUSTOMER',
    1
),
(
    'Amanda Wijesinghe',
    'amanda@gmail.com',
    'hashed_password_004',
    '0754567890',
    'Kotte',
    'CUSTOMER',
    1
),
(
    'Nethmi Jayawardena',
    'nethmi@gmail.com',
    'hashed_password_005',
    '0785678901',
    'Maharagama',
    'CUSTOMER',
    1
),
(
    'Kasun Admin',
    'admin@vorynza.com',
    'admin_password',
    '0112345678',
    'Colombo',
    'ADMIN',
    1
);

GO


/* ============================================================
   14 - HOTELS DATA
   ============================================================ */

INSERT INTO dbo.Hotels
(
    name,
    location,
    description,
    contact
)
VALUES
(
    'Vorynza Grand Colombo',
    'Colombo 03',
    'Luxury wedding and event hotel located in the heart of Colombo.',
    '0112345678'
),
(
    'Vorynza Lakeside Resort',
    'Kandy',
    'Elegant lakeside resort suitable for weddings and private functions.',
    '0812345678'
),
(
    'Vorynza Beach Resort',
    'Bentota',
    'Beachfront hotel offering destination wedding packages.',
    '0342345678'
),
(
    'Vorynza Heritage Hotel',
    'Galle',
    'Classic heritage hotel with premium wedding facilities.',
    '0912345678'
);

GO


/* ============================================================
   15 - WEDDING PACKAGES DATA
   ============================================================ */

INSERT INTO dbo.WeddingPackages
(
    hotel_id,
    name,
    price,
    inclusions,
    description,
    package_type,
    image_url,
    discount_percent,
    is_featured,
    is_active
)
VALUES
(
    1,
    'Royal Wedding Package',
    850000.00,
    'Full hall decoration, buffet, wedding cake, photography, DJ',
    'Premium wedding package for large celebrations.',
    'Luxury',
    'royal-wedding.jpg',
    10.00,
    1,
    1
),
(
    1,
    'Classic Wedding Package',
    550000.00,
    'Hall decoration, buffet, wedding cake, sound system',
    'Elegant wedding package at an affordable price.',
    'Classic',
    'classic-wedding.jpg',
    5.00,
    1,
    1
),
(
    2,
    'Lakeside Romance',
    700000.00,
    'Lakeside venue, floral decoration, buffet, photography',
    'Romantic wedding package overlooking Kandy Lake.',
    'Premium',
    'lakeside.jpg',
    8.00,
    1,
    1
),
(
    3,
    'Beach Paradise',
    950000.00,
    'Beach venue, decorations, seafood buffet, photography, DJ',
    'Destination wedding package at the beach.',
    'Destination',
    'beach-wedding.jpg',
    12.00,
    1,
    1
),
(
    4,
    'Heritage Elegance',
    625000.00,
    'Heritage hall, traditional decoration, buffet and photography',
    'Traditional wedding experience in a heritage setting.',
    'Traditional',
    'heritage.jpg',
    0.00,
    0,
    1
),
(
    2,
    'Small Wedding Package',
    350000.00,
    'Hall decoration, buffet and sound system',
    'Affordable package for smaller weddings.',
    'Budget',
    'small-wedding.jpg',
    5.00,
    0,
    1
);

GO


/* ============================================================
   16 - HALLS DATA
   ============================================================ */

INSERT INTO dbo.Halls
(
    hotel_id,
    name,
    capacity,
    decoration_theme,
    price,
    image_urls,
    average_rating,
    is_active
)
VALUES
(
    1,
    'Grand Ballroom',
    500,
    'Royal Gold',
    450000.00,
    'grand-ballroom.jpg',
    4.80,
    1
),
(
    1,
    'Colombo Banquet Hall',
    250,
    'Classic White',
    250000.00,
    'colombo-banquet.jpg',
    4.50,
    1
),
(
    2,
    'Lakeside Ballroom',
    350,
    'Romantic Floral',
    350000.00,
    'lakeside-ballroom.jpg',
    4.70,
    1
),
(
    2,
    'Kandy Garden Hall',
    180,
    'Garden Theme',
    200000.00,
    'garden-hall.jpg',
    4.30,
    1
),
(
    3,
    'Beachfront Hall',
    400,
    'Tropical',
    500000.00,
    'beachfront.jpg',
    4.90,
    1
),
(
    4,
    'Heritage Grand Hall',
    300,
    'Traditional',
    300000.00,
    'heritage-hall.jpg',
    4.60,
    1
);

GO


/* ============================================================
   17 - CATERING PACKAGES DATA
   ============================================================ */

INSERT INTO dbo.CateringPackages
(
    name,
    category,
    price,
    description,
    is_vegetarian,
    is_active
)
VALUES
(
    'Royal Buffet',
    'Buffet',
    4500.00,
    'Premium Sri Lankan and international buffet.',
    0,
    1
),
(
    'Classic Buffet',
    'Buffet',
    3000.00,
    'Classic buffet with popular local dishes.',
    0,
    1
),
(
    'Vegetarian Delight',
    'Vegetarian',
    2500.00,
    'Complete vegetarian buffet selection.',
    1,
    1
),
(
    'Premium Seafood',
    'Seafood',
    5500.00,
    'Premium seafood buffet with fresh seafood.',
    0,
    1
),
(
    'Kids Special',
    'Kids',
    1800.00,
    'Special meal selection for children.',
    0,
    1
);

GO


/* ============================================================
   18 - MENU ITEMS DATA
   ============================================================ */

INSERT INTO dbo.MenuItems
(
    name,
    category,
    price,
    description,
    is_vegetarian,
    catering_package_id,
    is_active
)
VALUES
(
    'Chicken Biryani',
    'Rice',
    950.00,
    'Aromatic chicken biryani.',
    0,
    1,
    1
),
(
    'Seafood Fried Rice',
    'Rice',
    1200.00,
    'Fried rice with fresh seafood.',
    0,
    1,
    1
),
(
    'Vegetable Fried Rice',
    'Rice',
    750.00,
    'Fried rice with fresh vegetables.',
    1,
    3,
    1
),
(
    'Chicken Curry',
    'Curry',
    850.00,
    'Traditional Sri Lankan chicken curry.',
    0,
    2,
    1
),
(
    'Dhal Curry',
    'Curry',
    500.00,
    'Creamy Sri Lankan dhal curry.',
    1,
    3,
    1
),
(
    'Devilled Prawns',
    'Seafood',
    1400.00,
    'Spicy devilled prawns.',
    0,
    4,
    1
),
(
    'Mixed Vegetable Curry',
    'Curry',
    600.00,
    'Mixed seasonal vegetables.',
    1,
    3,
    1
),
(
    'Chocolate Cake',
    'Dessert',
    700.00,
    'Rich chocolate celebration cake.',
    1,
    1,
    1
),
(
    'Fruit Salad',
    'Dessert',
    550.00,
    'Fresh seasonal fruit salad.',
    1,
    3,
    1
),
(
    'Ice Cream',
    'Dessert',
    450.00,
    'Assorted ice cream selection.',
    1,
    5,
    1
);

GO


/* ============================================================
   19 - RESERVATIONS DATA
   ============================================================ */

INSERT INTO dbo.Reservations
(
    user_id,
    hall_id,
    package_id,
    event_date,
    guest_count,
    status,
    notes
)
VALUES
(
    1,
    1,
    1,
    '2026-10-10',
    420,
    'CONFIRMED',
    'Bride requested additional floral decoration.'
),
(
    2,
    2,
    2,
    '2026-10-18',
    220,
    'PENDING',
    'Customer requested vegetarian menu.'
),
(
    3,
    3,
    3,
    '2026-11-05',
    300,
    'CONFIRMED',
    'Lakeside photography required.'
),
(
    4,
    5,
    4,
    '2026-11-20',
    380,
    'CONFIRMED',
    'Beach decoration and DJ required.'
),
(
    5,
    6,
    5,
    '2026-12-12',
    270,
    'PENDING',
    'Traditional Sri Lankan theme.'
),
(
    1,
    4,
    6,
    '2026-12-20',
    150,
    'CANCELLED',
    'Customer cancelled due to date change.'
);

GO


/* ============================================================
   20 - INVOICES DATA
   ============================================================ */

INSERT INTO dbo.Invoices
(
    reservation_id,
    amount,
    paid_amount,
    status,
    payment_method,
    paid_at
)
VALUES
(
    1,
    850000.00,
    850000.00,
    'PAID',
    'CARD',
    '2026-09-20 10:30:00'
),
(
    2,
    550000.00,
    100000.00,
    'PARTIAL',
    'BANK_TRANSFER',
    '2026-09-21 14:20:00'
),
(
    3,
    700000.00,
    700000.00,
    'PAID',
    'CARD',
    '2026-09-22 09:15:00'
),
(
    4,
    950000.00,
    500000.00,
    'PARTIAL',
    'BANK_TRANSFER',
    '2026-09-23 16:45:00'
),
(
    5,
    625000.00,
    0.00,
    'UNPAID',
    NULL,
    NULL
),
(
    6,
    350000.00,
    0.00,
    'CANCELLED',
    NULL,
    NULL
);

GO


/* ============================================================
   21 - CHECK ALL TABLES
   ============================================================ */

SELECT * FROM dbo.Users;
SELECT * FROM dbo.Hotels;
SELECT * FROM dbo.WeddingPackages;
SELECT * FROM dbo.Halls;
SELECT * FROM dbo.CateringPackages;
SELECT * FROM dbo.MenuItems;
SELECT * FROM dbo.Reservations;
SELECT * FROM dbo.Invoices;

GO