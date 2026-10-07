package com.vorynza.wedding.config;

import com.vorynza.wedding.cateringmenu.entity.CateringPackage;
import com.vorynza.wedding.cateringmenu.entity.MenuItem;
import com.vorynza.wedding.cateringmenu.repository.CateringPackageRepository;
import com.vorynza.wedding.cateringmenu.repository.MenuItemRepository;
import com.vorynza.wedding.hallvenue.entity.Hall;
import com.vorynza.wedding.hallvenue.entity.Hotel;
import com.vorynza.wedding.hallvenue.repository.HallRepository;
import com.vorynza.wedding.hallvenue.repository.HotelRepository;
import com.vorynza.wedding.useraccount.entity.User;
import com.vorynza.wedding.useraccount.entity.UserRole;
import com.vorynza.wedding.useraccount.repository.UserRepository;
import com.vorynza.wedding.weddingpackage.entity.WeddingPackage;
import com.vorynza.wedding.weddingpackage.repository.WeddingPackageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEFAULT_PASSWORD = "Password123!";
    private static final String ADMIN_EMAIL = "admin@vorynza.com";
    private static final String CUSTOMER_EMAIL = "customer@vorynza.com";

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final WeddingPackageRepository packageRepository;
    private final HallRepository hallRepository;
    private final CateringPackageRepository cateringPackageRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            WeddingPackageRepository packageRepository,
            HallRepository hallRepository,
            CateringPackageRepository cateringPackageRepository,
            MenuItemRepository menuItemRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.packageRepository = packageRepository;
        this.hallRepository = hallRepository;
        this.cateringPackageRepository = cateringPackageRepository;
        this.menuItemRepository = menuItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureDemoUsers();

        Hotel hotel = hotelRepository.findAll().stream().findFirst().orElseGet(() -> {
            Hotel created = seedHotel();
            log.info("Seeded sample hotel");
            return created;
        });

        if (packageRepository.count() == 0) {
            seedPackages(hotel);
            log.info("Seeded sample wedding packages");
        }
        if (hallRepository.count() == 0) {
            seedHalls(hotel);
            log.info("Seeded sample halls");
        }
        if (cateringPackageRepository.count() == 0) {
            seedCatering();
            log.info("Seeded sample catering packages and menu items");
        }
    }

    private void ensureDemoUsers() {
        String hash = passwordEncoder.encode(DEFAULT_PASSWORD);
        upsertDemoUser("System Admin", ADMIN_EMAIL, hash, "0770000001", "Colombo", UserRole.ADMIN);
        upsertDemoUser("Demo Customer", CUSTOMER_EMAIL, hash, "0770000002", "Kandy", UserRole.CUSTOMER);
        log.info("Demo logins ready: {} / {} (password {})", ADMIN_EMAIL, CUSTOMER_EMAIL, DEFAULT_PASSWORD);
    }

    private void upsertDemoUser(
            String fullName,
            String email,
            String hash,
            String phone,
            String address,
            UserRole role
    ) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPasswordHash(hash);
        user.setPhone(phone);
        user.setAddress(address);
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);
    }

    private Hotel seedHotel() {
        Hotel hotel = new Hotel();
        hotel.setName("Grand Palm Hotel");
        hotel.setLocation("Colombo");
        hotel.setDescription("Luxury wedding venue with garden and ballroom.");
        hotel.setContact("0112000000");
        return hotelRepository.save(hotel);
    }

    private void seedPackages(Hotel hotel) {
        WeddingPackage gold = new WeddingPackage();
        gold.setHotel(hotel);
        gold.setName("Gold Romance");
        gold.setPrice(new BigDecimal("450000.00"));
        gold.setInclusions("Hall, décor, buffet for 150, photography");
        gold.setDescription("Premium gold package");
        gold.setPackageType("PREMIUM");
        gold.setDiscountPercent(new BigDecimal("5.00"));
        gold.setFeatured(true);
        gold.setActive(true);
        packageRepository.save(gold);

        WeddingPackage silver = new WeddingPackage();
        silver.setHotel(hotel);
        silver.setName("Silver Classic");
        silver.setPrice(new BigDecimal("280000.00"));
        silver.setInclusions("Hall, basic décor, buffet for 100");
        silver.setDescription("Classic silver package");
        silver.setPackageType("STANDARD");
        silver.setDiscountPercent(BigDecimal.ZERO);
        silver.setFeatured(false);
        silver.setActive(true);
        packageRepository.save(silver);
    }

    private void seedHalls(Hotel hotel) {
        Hall crystal = new Hall();
        crystal.setHotel(hotel);
        crystal.setName("Crystal Ballroom");
        crystal.setCapacity(300);
        crystal.setDecorationTheme("Crystal & Gold");
        crystal.setPrice(new BigDecimal("150000.00"));
        crystal.setImageUrls("");
        crystal.setAverageRating(new BigDecimal("4.80"));
        crystal.setActive(true);
        hallRepository.save(crystal);

        Hall garden = new Hall();
        garden.setHotel(hotel);
        garden.setName("Garden Pavilion");
        garden.setCapacity(150);
        garden.setDecorationTheme("Garden Floral");
        garden.setPrice(new BigDecimal("90000.00"));
        garden.setImageUrls("");
        garden.setAverageRating(new BigDecimal("4.50"));
        garden.setActive(true);
        hallRepository.save(garden);
    }

    private void seedCatering() {
        CateringPackage royal = new CateringPackage();
        royal.setName("Royal Buffet");
        royal.setCategory("BUFFET");
        royal.setPrice(new BigDecimal("3500.00"));
        royal.setDescription("Full buffet per guest");
        royal.setVegetarian(false);
        royal.setActive(true);
        royal = cateringPackageRepository.save(royal);

        CateringPackage veggie = new CateringPackage();
        veggie.setName("Veggie Delight");
        veggie.setCategory("VEGETARIAN");
        veggie.setPrice(new BigDecimal("2800.00"));
        veggie.setDescription("Vegetarian set menu");
        veggie.setVegetarian(true);
        veggie.setActive(true);
        veggie = cateringPackageRepository.save(veggie);

        MenuItem rice = new MenuItem();
        rice.setName("Steamed Rice");
        rice.setCategory("RICE");
        rice.setPrice(new BigDecimal("400.00"));
        rice.setDescription("Steamed basmati");
        rice.setVegetarian(true);
        rice.setCateringPackage(royal);
        rice.setActive(true);
        menuItemRepository.save(rice);

        MenuItem chicken = new MenuItem();
        chicken.setName("Chicken Curry");
        chicken.setCategory("MAIN");
        chicken.setPrice(new BigDecimal("850.00"));
        chicken.setDescription("Spicy chicken");
        chicken.setVegetarian(false);
        chicken.setCateringPackage(royal);
        chicken.setActive(true);
        menuItemRepository.save(chicken);

        MenuItem dessert = new MenuItem();
        dessert.setName("Watalappan");
        dessert.setCategory("DESSERT");
        dessert.setPrice(new BigDecimal("350.00"));
        dessert.setDescription("Traditional dessert");
        dessert.setVegetarian(true);
        dessert.setCateringPackage(veggie);
        dessert.setActive(true);
        menuItemRepository.save(dessert);
    }
}
