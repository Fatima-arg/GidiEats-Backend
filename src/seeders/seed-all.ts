import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { env } from '../config/env';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ROLES,
  VEHICLE_TYPES
} from '../config/constants';
import { ensureImageDir, writePlaceholder } from '../utils/images';
import {
  User, Customer, Restaurant, RestaurantStaff, Rider, Category, FoodItem,
  Address, Order, OrderItem, Payment, Delivery, Notification, OrderStatusHistory
} from '../models';

const SEED_PASSWORD = env.seedPassword;

const hash = (p: string) => bcrypt.hash(p, 10);

const photoSlug = (name: string) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// If a real photo already exists in the uploads dir, keep it across re-seeds
// instead of reverting to the placeholder initials.
const photoIfExists = (dir: string, base: string): string | null => {
  const file = path.join(dir, `${base}.jpg`);
  return fs.existsSync(file) ? `/uploads/${base}.jpg` : null;
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const daysAgo = (days: number, hourOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randInt(8, 21), randInt(0, 59), randInt(0, 59), 0);
  if (hourOffset) d.setHours(Math.min(23, d.getHours() + hourOffset));
  return d;
};
const naira = (n: number) => Math.round(n * 100) / 100;

// Authentic Northern / Kano names reflecting Fatima Adam Aminu's BUK student context
const firstNames = [
  'Fatima', 'Aisha', 'Zainab', 'Maryam', 'Aminu', 'Ibrahim', 'Usman', 'Balarabe',
  'Sani', 'Kabiru', 'Halima', 'Khadija', 'Hauwa', 'Nafisa', 'Bello', 'Aliyu',
  'Mansur', 'Mustapha', 'Umar', 'Salisu', 'Farouk', 'Abubakar', 'Jamilu', 'Nasiru',
  'Bashir', 'Safiya', 'Ruqayya', 'Hassana', 'Husseina', 'Rabiu', 'Yakubu', 'Sanusi'
];
const lastNames = [
  'Adam Aminu', 'Dankoli', 'Sanusi', 'Bello', 'Gwarzo', 'Dambatta', 'Shehu', 'Gaya',
  'Rano', 'Kazaure', 'Garba', 'Musa', 'Yusuf', 'Aliyu', 'Umar', 'Suleiman',
  'Bala', 'Ibrahim', 'Haruna', 'Tofa', 'Kabuga', 'Kano', 'Danbare', 'Bichi',
  'Karaye', 'Gumel', 'Hadejia', 'Wudil', 'Fagge', 'Kurna', 'Gadon Kaya', 'Rimin Gata'
];

// Kano and Bayero University Kano (BUK) localities & campuses
const CITIES = [
  'BUK New Site', 'Danbare', 'Kofar Kabuga', 'BUK Old Site',
  'Gwarzo Road', 'Jambulo', 'Kofar Gadon Kaya', 'Ungogo'
];
const STREETS = [
  'Gwarzo Road', 'Danbare Campus Road', 'BUK Main Boulevard', 'Jambulo First Gate',
  'Aminu Kano Way', 'Danbare Bypass', 'Kofar Ruwa - Kofar Kabuga Road', 'Faculty of CIS Way',
  'New Site Ring Road', 'Old Site Main Gate Road', 'Rimin Gata Road', 'TAT Plaza Avenue'
];
const NEIGHBORHOODS = [
  'Nana Hall BUK New Site', 'Saadu Zungur Hall BUK New Site', 'Ramat Hall BUK Old Site',
  'Danbare Student Lodge Plot 12', 'Belmoh House Plaza Opposite BUK', 'Sharu Abba Plaza Kabuga',
  'Siraj Royal Plaza Jambulo', 'TAT Plaza Kofar Kabuga', 'BUK New Site CIS Faculty Complex',
  'BUK Medical Hostel', 'Hawan Dawaki Tofa Lodge', 'Kofar Dukayuwa Quarters'
];

// The 10 real Kano restaurants close to BUK New Site with realistic ratings & pricing
const restaurantSeeds = [
  {
    name: 'Pecancity Restaurant & Game Lounge',
    cuisineType: 'Nigerian & West African',
    phone: '08031234001',
    city: 'BUK New Site',
    street: 'Belmoh House / 15 Ibn Awal Plaza, Opposite BUK New Site, Gwarzo Rd',
    state: 'Kano',
    deliveryFee: 500,
    deliveryTimeMin: 35,
    rating: 4.2,
    ratingCount: 37,
    opensAt: '09:00',
    closesAt: '23:00'
  },
  {
    name: 'B-B Treats',
    cuisineType: 'Fast Food & Student Treats',
    phone: '08031234002',
    city: 'Danbare',
    street: 'Danbare, opposite BUK new site, Hawan Dawaki, Tofa',
    state: 'Kano',
    deliveryFee: 350,
    deliveryTimeMin: 20,
    rating: 4.3,
    ratingCount: 45,
    opensAt: '08:00',
    closesAt: '22:00'
  },
  {
    name: 'The Cooks Restaurant',
    cuisineType: 'West African & Quick Meals',
    phone: '08031234003',
    city: 'Danbare',
    street: 'Danbare Bypass, Ungogo',
    state: 'Kano',
    deliveryFee: 400,
    deliveryTimeMin: 25,
    rating: 4.0,
    ratingCount: 18,
    opensAt: '07:00',
    closesAt: '23:00'
  },
  {
    name: 'TAYBAH Restaurant',
    cuisineType: 'Arab & Mediterranean Grills',
    phone: '08031234004',
    city: 'Jambulo',
    street: 'No 1-3 Royal Plaza, Jambulo First Gate, Kabuga Gwarzo Rd',
    state: 'Kano',
    deliveryFee: 600,
    deliveryTimeMin: 35,
    rating: 4.3,
    ratingCount: 66,
    opensAt: '12:00',
    closesAt: '23:59'
  },
  {
    name: 'Frenchies Restaurant',
    cuisineType: 'Fine Dining, Pizza & Bakery',
    phone: '08031234005',
    city: 'Kofar Kabuga',
    street: 'No. 207 Gwarzo Road, Kofar Kabuga',
    state: 'Kano',
    deliveryFee: 800,
    deliveryTimeMin: 40,
    rating: 4.1,
    ratingCount: 37,
    opensAt: '11:00',
    closesAt: '23:59'
  },
  {
    name: 'Anisa Restaurant and Lounge',
    cuisineType: 'Fast Food & Lounge Dining',
    phone: '08031234006',
    city: 'Kofar Kabuga',
    street: 'Shop 4, Sharu Abba Plaza, along BUK Road, opp AYM Shafa',
    state: 'Kano',
    deliveryFee: 500,
    deliveryTimeMin: 30,
    rating: 4.4,
    ratingCount: 7,
    opensAt: '09:00',
    closesAt: '21:00'
  },
  {
    name: 'KFC Kabuga (BUK / Kano 2)',
    cuisineType: 'Fast Food & Fried Chicken',
    phone: '08031234007',
    city: 'Kofar Kabuga',
    street: '22 Gwarzo Road, Kofar Kabuga',
    state: 'Kano',
    deliveryFee: 600,
    deliveryTimeMin: 25,
    rating: 4.1,
    ratingCount: 160,
    opensAt: '09:00',
    closesAt: '22:30'
  },
  {
    name: 'Royal Taste Restaurant',
    cuisineType: 'Kebabs, Burgers & Local Dishes',
    phone: '08031234008',
    city: 'Kofar Kabuga',
    street: 'Kofar Kabuga Main Road',
    state: 'Kano',
    deliveryFee: 500,
    deliveryTimeMin: 30,
    rating: 4.1,
    ratingCount: 26,
    opensAt: '09:00',
    closesAt: '23:00'
  },
  {
    name: 'Dee_Royale Eatery N Restaurant',
    cuisineType: 'Chinese Rice & Fast Food',
    phone: '08031234009',
    city: 'Kofar Kabuga',
    street: 'Plot C16, TAT Plaza, Kofar Ruwa - Kofar Kabuga Rd',
    state: 'Kano',
    deliveryFee: 550,
    deliveryTimeMin: 30,
    rating: 4.5,
    ratingCount: 15,
    opensAt: '10:00',
    closesAt: '22:00'
  },
  {
    name: 'Katforex Restaurant',
    cuisineType: 'Shawarma, Wings & Burgers',
    phone: '08031234010',
    city: 'Kofar Gadon Kaya',
    street: '537 Aminu Kano Way, Kofar Gadon Kaya',
    state: 'Kano',
    deliveryFee: 600,
    deliveryTimeMin: 30,
    rating: 4.1,
    ratingCount: 32,
    opensAt: '08:00',
    closesAt: '23:00'
  }
];

type FoodSeed = { name: string; description: string; price: number };
type CategorySeed = { name: string; description: string; items: FoodSeed[] };

const menuSeeds: Record<string, CategorySeed[]> = {
  'Pecancity Restaurant & Game Lounge': [
    {
      name: 'African & Nigerian Classics',
      description: 'Authentic local favorites cooked with pride opposite BUK New Site',
      items: [
        { name: 'Pounded Yam with Egusi & Goat Meat', description: 'Silky pounded yam with rich egusi soup, assorted goat meat and stockfish', price: 4500 },
        { name: 'Amala with Ewedu, Gbegiri & Tender Beef', description: 'Smooth Oyo-style amala with steaming ewedu, golden gbegiri and peppered beef', price: 3500 },
        { name: 'Tuwon Shinkafa & Miyan Taushe', description: 'Traditional northern rice swallow served with rich pumpkin vegetable soup and meat', price: 3500 },
        { name: 'Party Jollof Rice with Fried Chicken', description: 'Smoky firewood-style party jollof served with crispy fried quarter chicken and dodo', price: 3800 },
        { name: 'Pecan Special Fried Rice with Beef', description: 'Fragrant seasoned fried rice with sweet corn, liver bits and succulent beef cubes', price: 4000 }
      ]
    },
    {
      name: 'Grills & Seafood',
      description: 'Hot off the fire, seasoned with spicy northern peppers',
      items: [
        { name: 'Spicy Peppered Whole Catfish', description: 'Charcoal-grilled whole catfish smothered in fiery onion-pepper sauce', price: 5500 },
        { name: 'Charcoal Grilled Quarter Chicken', description: 'Marinated in yaji and suya spice, grilled tender and juicy', price: 3200 },
        { name: 'Asun Spicy Goat Meat Platter', description: 'Chopped tender goat meat stir-fried with hot Scotch bonnets and onions', price: 4000 }
      ]
    },
    {
      name: 'Game Lounge Drinks & Sides',
      description: 'Chilled sips and tasty sides for gamers and students',
      items: [
        { name: 'Pecan Signature Mocktail', description: 'Refreshing blended citrus, grenadine and tropical fruit punch', price: 1800 },
        { name: 'Chilled Zobo with Ginger & Clove', description: 'Cold-steeped hibiscus drink with crushed ginger, clove and pineapple', price: 800 },
        { name: 'Fried Plantain (Dodo) Portion', description: 'Sweet ripe golden plantain slices fried to perfection', price: 1200 }
      ]
    }
  ],

  'B-B Treats': [
    {
      name: 'Student Quick Bites',
      description: 'Budget-friendly, super fast meals for BUK students in Danbare',
      items: [
        { name: 'Golden Fried Yam & Pepper Sauce with Egg', description: 'Crispy deep-fried golden yam batons served with fried eggs and ata dindin', price: 1500 },
        { name: 'Crispy French Fries & Chicken Drumstick', description: 'Golden salted French fries with a seasoned crispy fried chicken drumstick', price: 2500 },
        { name: 'Danbare Student Fried Rice & Chicken', description: 'Student-sized fried rice with sweet carrots, peas and fried chicken piece', price: 2200 },
        { name: 'Danbare Special Jollof Rice & Beef', description: 'Rich tomato jollof rice served with tender fried beef chunk and plantain', price: 2000 },
        { name: 'Golden Sweet Potato Chips & Fried Egg', description: 'Crisp fried sweet potato chips with seasoned scrambled egg', price: 1400 }
      ]
    },
    {
      name: 'Fast Food & Pastries',
      description: 'Freshly baked pies, juicy burgers and wraps',
      items: [
        { name: 'B-B Chicken Shawarma (Single)', description: 'Toasted flatbread filled with shredded chicken, cabbage and creamy garlic mayo', price: 1800 },
        { name: 'B-B Jumbo Beef Burger', description: 'Grilled beef patty, cheddar slice, fresh tomato, onion and burger relish', price: 2200 },
        { name: 'Spicy Chicken Wings (6 pcs)', description: 'Crispy battered chicken wings tossed in mild chilli sauce', price: 2400 },
        { name: 'Flaky Beef Meat Pie & Soft Drink', description: 'Golden pastry crust stuffed with seasoned minced meat and potatoes', price: 1200 }
      ]
    },
    {
      name: 'Chilled Drinks',
      description: 'Ice cold refreshments for campus heat',
      items: [
        { name: 'Chilled Fresh Zobo Juice', description: 'Authentic Kano hibiscus juice with pineapple essence', price: 700 },
        { name: 'Cold Soft Drink (500ml)', description: 'Chilled Coca-Cola, Fanta, Sprite or Pepsi bottle', price: 600 }
      ]
    }
  ],

  'The Cooks Restaurant': [
    {
      name: 'Rice Plates & Combos',
      description: 'Quick meal stopovers and delivery favorites along Danbare Bypass',
      items: [
        { name: 'The Cooks Jollof Rice with Peppered Turkey', description: 'Rich party jollof rice paired with succulent peppered turkey wing and salad', price: 3500 },
        { name: 'Danbare Quick Bento Rice with Fried Fish', description: 'Steamed white rice, rich vegetable stew and crispy fried croaker fish fillet', price: 2800 },
        { name: 'Stir-fry Beef Spaghetti', description: 'Spaghetti noodles wok-tossed with beef strips, bell peppers and carrots', price: 2500 },
        { name: 'White Rice & Native Pepper Stew with Beef', description: 'Hot steamed basmati rice with spicy Nigerian stew and tender braised beef', price: 2400 }
      ]
    },
    {
      name: 'Swallow & Hausa Classics',
      description: 'Traditional home-cooked comfort soups and swallow',
      items: [
        { name: 'Semovita with Bitterleaf & Assorted Meat', description: 'Smooth semovita served with rich onugbu soup and tender tripe & beef', price: 2800 },
        { name: 'Tuwo Da Miyan Kuka with Cow Tail', description: 'Hausa corn meal swallow with nutrient-rich baobab leaf soup and soft cow tail', price: 3000 }
      ]
    },
    {
      name: 'Grills & Finger Foods',
      description: 'Crispy snacks and sides',
      items: [
        { name: 'Crispy Fried Chicken & French Fries', description: 'Quarter chicken battered and deep fried with skin-on potato fries', price: 3000 },
        { name: 'Crispy Spring Rolls & Samosa Combo', description: '4 flaky minced beef samosas and 4 vegetable spring rolls with sweet dip', price: 1500 },
        { name: 'The Cooks Classic Chapman', description: 'Blended Fanta, Sprite, Angostura bitters and sliced cucumber and lemon', price: 1200 }
      ]
    }
  ],

  'TAYBAH Restaurant': [
    {
      name: 'Arabian Specialties',
      description: 'Authentic Middle Eastern recipes crafted with aromatic Gulf spices',
      items: [
        { name: 'Arabian Chicken Mandi Rice with Garlic Sauce', description: 'Slow-smoked tender chicken served on long-grain spiced basmati mandi rice with toum', price: 5500 },
        { name: 'Lamb Kabsa Rice with Spiced Gravy', description: 'Tender braised lamb chunks over saffron kabsa rice, toasted almonds and raisins', price: 6500 },
        { name: 'Taybah Mixed Grill Platter (Beef, Chicken & Kebab)', description: 'Skewers of shish taouk, kofta kebab and spiced beef cubes with grilled tomatoes', price: 8500 }
      ]
    },
    {
      name: 'Shawarma, Wraps & Vegan Friendly',
      description: 'Warm pita wraps and wholesome vegetarian Mediterranean plates',
      items: [
        { name: 'Arabic Beef Shawarma with Tahini & Pickles', description: 'Tender spiced beef shaved into fresh saj bread with tahini, parsley and pickles', price: 2600 },
        { name: 'Authentic Crispy Falafel Wrap with Hummus', description: 'Crisp chickpea falafel patties wrapped with creamy hummus and garden greens', price: 2200 },
        { name: 'Creamy Hummus with Fresh Pita Bread', description: 'Silky blended chickpeas with tahini, olive oil, sumac and two warm pita breads', price: 2000 },
        { name: 'Tabbouleh Fresh Herb Salad', description: 'Finely chopped parsley, mint, tomatoes, bulgur and fresh lemon-olive dressing', price: 1800 }
      ]
    },
    {
      name: 'Teas, Coffees & Lounge Drinks',
      description: 'Traditional brews and cool refreshments',
      items: [
        { name: 'Spiced Arabic Karak Chai Tea', description: 'Strong black tea simmered with cardamom, evaporated milk, saffron and cloves', price: 1000 },
        { name: 'Traditional Turkish Coffee Pot', description: 'Finely ground coffee brewed in a cezve with gentle cardamom notes', price: 1200 },
        { name: 'Taybah Special Shisha Lounge Mocktail', description: 'Layered pomegranate, lime, mint leaves and sparkling soda', price: 2000 },
        { name: 'Fresh Mint Lemonade', description: 'Freshly squeezed lemon juice blended with fresh garden mint leaves and ice', price: 1400 }
      ]
    }
  ],

  'Frenchies Restaurant': [
    {
      name: 'Signature Artisan Pizzas (Large)',
      description: 'Hand-tossed gourmet crusts baked in authentic stone ovens (12-inch)',
      items: [
        { name: 'Frenchies Deluxe Pepperoni Pizza (Large)', description: 'Double layer of cured beef pepperoni, aged mozzarella and San Marzano tomato sauce', price: 12500 },
        { name: 'Signature BBQ Beef & Chicken Supreme Pizza (Large)', description: 'Smoky BBQ glaze, braised beef, smoked chicken breast, bell peppers and red onions', price: 13500 },
        { name: 'Quattro Formaggi Four-Cheese Pizza (Large)', description: 'Mozzarella, gorgonzola, parmesan and creamy ricotta on a golden herb crust', price: 14000 }
      ]
    },
    {
      name: 'Fine Dining Mains',
      description: 'Premium culinary plates for executive dining in Kano (₦10k–₦20k tier)',
      items: [
        { name: 'Grilled Ribeye Steak with Herb Butter & Mash', description: 'Prime 350g beef ribeye steak grilled to medium with rosemary butter and garlic potato mash', price: 18500 },
        { name: 'Executive Mixed Fried Rice & Grilled Jumbo Prawns', description: 'Basmati wok fried rice served with four colossal char-grilled tiger prawns and herb butter', price: 14000 },
        { name: 'Frenchies Pan-Seared Salmon with Asparagus', description: 'Norwegian salmon fillet seared crisp with lemon caper sauce and roasted baby carrots', price: 19500 },
        { name: 'Gourmet Frenchies Jumbo Shawarma', description: 'Double portion shredded prime beef, chicken strips, melted gouda and signature French sauce', price: 4500 }
      ]
    },
    {
      name: 'Bakery, Gelato & Desserts',
      description: 'Handcrafted pastries and artisanal desserts from Frenchies bakery',
      items: [
        { name: 'Artisanal French Bakery Pastry Box (4 pcs)', description: 'Butter croissant, pain au chocolat, almond danish and cinnamon swirl', price: 6000 },
        { name: 'Belgian Chocolate & Pistachio Gelato Tub', description: 'Rich churned Italian gelato made with pure Belgian cocoa and Sicilian pistachio', price: 4000 },
        { name: 'Classic Italian Tiramisu Cake Slice', description: 'Savoiardi ladyfingers soaked in espresso, layered with mascarpone cream and cocoa dust', price: 3500 }
      ]
    }
  ],

  'Anisa Restaurant and Lounge': [
    {
      name: 'Burgers & Sandwiches',
      description: 'Juicy gourmet burgers and loaded sandwiches in a cool lounge setting',
      items: [
        { name: 'Anisa Double Cheeseburger & Seasoned Chips', description: 'Two 100% beef patties, double cheddar cheese, lettuce, house burger sauce and fries', price: 3800 },
        { name: 'Crispy Buttermilk Chicken Burger', description: 'Fried chicken breast tossed in buttermilk batter, spicy mayo, pickles and brioche bun', price: 3400 },
        { name: 'Triple Decker Club Sandwich with Fries', description: 'Layered toasted bread with grilled chicken, bacon, boiled egg, cheese and crisp slaw', price: 3000 }
      ]
    },
    {
      name: 'Pastas & Wings',
      description: 'Comforting pastas and fiery glazed chicken wings',
      items: [
        { name: 'Creamy Chicken & Mushroom Penne Pasta', description: 'Al dente penne pasta in velvety parmesan cream sauce with grilled chicken and mushrooms', price: 4200 },
        { name: 'Spicy BBQ Glazed Crispy Wings (8 pcs)', description: 'Crisp chicken wings glazed in sweet and smoky hickory BBQ sauce with herb ranch', price: 3600 },
        { name: 'Hot Buffalo Wings with Ranch Dip (8 pcs)', description: 'Fiery cayenne pepper glazed wings served with celery sticks and cool ranch dip', price: 3600 }
      ]
    },
    {
      name: 'Lounge Shakes & Coolers',
      description: 'Thick creamy milkshakes and signature coolers',
      items: [
        { name: 'Oreo Vanilla Thick Milkshake', description: 'Creamy vanilla ice cream blended with crushed Oreo cookies, whipped cream and drizzle', price: 2200 },
        { name: 'Strawberry Cream Frappé', description: 'Blended sweet strawberries, milk, crushed ice and whipped cream topping', price: 2200 },
        { name: 'Classic Chapman with Angostura Bitters', description: 'Traditional Nigerian cocktail with cucumber wheels and fresh lime wedges', price: 1500 }
      ]
    }
  ],

  'KFC Kabuga (BUK / Kano 2)': [
    {
      name: 'Chicken Buckets & Pieces',
      description: 'World-famous 11 herbs & spices fried chicken, made fresh in Kabuga',
      items: [
        { name: '5pc Hot & Crispy Chicken Bucket', description: '5 juicy pieces of KFC signature Hot & Crispy chicken with secret herb marinade', price: 7200 },
        { name: '10pc Crispy Drumsticks & Thighs Feast', description: '10 pieces of golden fried chicken perfect for sharing with campus roommates', price: 13500 },
        { name: '3pc Chicken & Large Fries Combo', description: '3 golden chicken pieces, large seasoned potato fries and dip sauce', price: 4500 }
      ]
    },
    {
      name: 'Burgers & Rice Meals',
      description: 'Hearty fast-food burger combos and seasoned rice bowls',
      items: [
        { name: 'Zinger Burger Combo with Fries & Drink', description: 'Spicy fiery chicken fillet burger, large fries and a chilled 500ml drink', price: 4800 },
        { name: 'Colonel’s Jollof Rice Bowl with Crispy Strips', description: 'Spiced Nigerian rice bowl topped with 3 crunchy boneless crispy chicken strips', price: 3200 },
        { name: 'Crispy Popcorn Chicken & Fries', description: 'Bite-sized tender crispy chicken pieces with golden salted French fries', price: 2800 }
      ]
    },
    {
      name: 'Sides & Drinks',
      description: 'Essential complements to your KFC meal',
      items: [
        { name: 'Chilled Pepsi 500ml Bottle', description: 'Refreshing cold Pepsi bottle straight from the cooler', price: 600 },
        { name: 'KFC Signature Coleslaw Bowl', description: 'Crisp cabbage and carrots tossed in sweet and tangy signature dressing', price: 1000 }
      ]
    }
  ],

  'Royal Taste Restaurant': [
    {
      name: 'Kebabs & Suya Grills',
      description: 'Kano-style spiced skewers and flame-grilled meats in Kofar Kabuga',
      items: [
        { name: 'Royal Spiced Beef Kebabs (5 Skewers)', description: 'Succulent minced beef skewers seasoned with ginger, garlic and northern kilishi spice', price: 3000 },
        { name: 'Spicy Boneless Chicken Suya Platter', description: 'Tender grilled chicken chunks tossed in spicy yaji pepper with onions and cabbage', price: 3200 },
        { name: 'Grilled Peppered Gizzard & Plantain', description: 'Slow-cooked chicken gizzards tossed in fiery pepper sauce with sweet fried plantain', price: 2800 }
      ]
    },
    {
      name: 'Hausa & Continental Dishes',
      description: 'Hearty traditional staples and comfort plates',
      items: [
        { name: 'Tuwo Da Miyan Kuka with Slow-Cooked Beef', description: 'Authentic Hausa corn swallow paired with dried baobab leaf soup and tender beef cuts', price: 2800 },
        { name: 'Royal Taste House Special Burger & Chips', description: 'Seasoned beef patty, sunny-side fried egg, lettuce, cheddar and salted fries', price: 3200 },
        { name: 'Fried Rice with Peppered Quarter Chicken', description: 'Savory fried rice with vegetables, paired with peppered quarter chicken', price: 3500 },
        { name: 'Party Jollof Rice with Boiled Egg & Dodo', description: 'Smoky party jollof served with hard-boiled egg and golden ripe fried plantains', price: 2600 }
      ]
    },
    {
      name: 'Refreshing Drinks',
      description: 'Natural juices and cool thirst quenchers',
      items: [
        { name: 'Freshly Blended Apple & Orange Cocktail', description: 'Pure cold-pressed crisp apples and sweet oranges with no added sugar', price: 1500 },
        { name: 'Chilled Zobo with Fresh Mint', description: 'Traditional hibiscus infusion with garden mint and soothing ginger', price: 800 }
      ]
    }
  ],

  'Dee_Royale Eatery N Restaurant': [
    {
      name: 'Chinese Rice & Asian Specialties',
      description: 'Top-rated Chinese fried rice and sauced dishes at TAT Plaza Kabuga',
      items: [
        { name: 'Dee_Royale Chinese Fried Rice & Sauced Chicken', description: 'Wok-tossed fried rice with spring onions, soy glaze and deep-flavored sauced chicken', price: 3800 },
        { name: 'Special Egg & Shrimp Fried Rice Plate', description: 'Fluffy fried rice tossed with scrambled eggs, tiny dried shrimp and fresh scallions', price: 4200 },
        { name: 'Crispy Sweet & Sour Chicken with Fried Rice', description: 'Crisp chicken nuggets tossed in tangy bell pepper sweet and sour sauce over rice', price: 3600 },
        { name: 'Stir-fry Chicken Egg Noodles', description: 'Chinese wheat egg noodles stir-fried with chicken shreds, carrots and green peppers', price: 2800 }
      ]
    },
    {
      name: 'Small Plates & Fast Food',
      description: 'Budget-friendly quick treats and finger foods',
      items: [
        { name: 'Crispy Spring Rolls & Samosa Platter (6 pcs)', description: 'Three crispy minced beef samosas and three vegetable spring rolls with chili sauce', price: 1800 },
        { name: 'Dee_Royale Crunchy Chicken Wrap', description: 'Crispy chicken strips, pickled cucumbers, shredded lettuce and garlic mayo wrap', price: 2200 },
        { name: 'Loaded Cheesy French Fries with Shredded Beef', description: 'Golden fries smothered in melted mozzarella, barbecue sauce and tender beef bits', price: 2500 }
      ]
    },
    {
      name: 'Hot & Cold Drinks',
      description: 'Spiced tea pots and chilled fruit coolers',
      items: [
        { name: 'Special Spiced Hot Tea Pot (Kano Blend)', description: 'Traditional Northern spiced black tea infused with ginger, cloves, habba and mint', price: 1200 },
        { name: 'Iced Peach Tea / Lemonade', description: 'Sweet peach flavored brewed iced tea served chilled over ice cubes', price: 1000 }
      ]
    }
  ],

  'Katforex Restaurant': [
    {
      name: 'Shawarma & Wraps',
      description: 'Kano-famous shawarma rolls and stuffed tortillas on Aminu Kano Way',
      items: [
        { name: 'Katforex Jumbo Beef Shawarma with Melted Cheese', description: 'Double spiced beef fillet, melted mozzarella, crunchy cabbage and garlic sauce wrap', price: 3200 },
        { name: 'Katforex Double Sausage & Chicken Shawarma', description: 'Seasoned shredded chicken, two beef sausages, sweet corn and house special cream', price: 3000 },
        { name: 'Classic Chicken Shawarma with Garlic Mayo', description: 'Tender chicken slices with fresh veggies and smooth roasted garlic mayonnaise', price: 2500 }
      ]
    },
    {
      name: 'Burgers & Wings',
      description: 'Flame-grilled burgers and crispy buffalo wings',
      items: [
        { name: 'Loaded Cheesy Beef Burger with Crispy Onion Rings', description: 'Grilled beef patty, double cheddar, battered onion rings, smoky sauce and toasted bun', price: 3800 },
        { name: 'Crispy Buffalo Chicken Wings (8 pcs)', description: 'Wings fried extra crispy and tossed in spicy tangy buffalo sauce', price: 3500 },
        { name: 'Quarter Grilled Chicken with Spicy Potato Chips', description: 'Tender spicy marinated quarter chicken served with hand-cut potato chips', price: 3600 }
      ]
    },
    {
      name: 'Smoothies & Coolers',
      description: 'Thick chilled smoothies and fresh fruit blends',
      items: [
        { name: 'Fresh Strawberry & Banana Smoothie', description: 'Blended sweet strawberries, ripe bananas, low-fat yogurt and honey drizzle', price: 1800 },
        { name: 'Mango Passionfruit Slush', description: 'Sweet northern mango puree blended with tangy passionfruit and crushed ice', price: 1500 },
        { name: 'Iced Lemon & Mint Tea', description: 'Freshly brewed black tea sweetened and served with crushed ice and fresh mint leaves', price: 1000 }
      ]
    }
  ]
};

const orderStatusPlan = (): { status: (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]; } => {
  const r = Math.random();
  if (r < 0.46) return { status: ORDER_STATUSES.DELIVERED };
  if (r < 0.56) return { status: ORDER_STATUSES.PENDING };
  if (r < 0.63) return { status: ORDER_STATUSES.CONFIRMED };
  if (r < 0.70) return { status: ORDER_STATUSES.PREPARING };
  if (r < 0.75) return { status: ORDER_STATUSES.READY_FOR_PICKUP };
  if (r < 0.79) return { status: ORDER_STATUSES.RIDER_ASSIGNED };
  if (r < 0.83) return { status: ORDER_STATUSES.PICKED_UP };
  if (r < 0.88) return { status: ORDER_STATUSES.OUT_FOR_DELIVERY };
  if (r < 0.95) return { status: ORDER_STATUSES.CANCELLED };
  return { status: ORDER_STATUSES.REJECTED };
};

const statusHistoryPath = (target: (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]) => {
  const full = [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.READY_FOR_PICKUP,
    ORDER_STATUSES.RIDER_ASSIGNED,
    ORDER_STATUSES.PICKED_UP,
    ORDER_STATUSES.OUT_FOR_DELIVERY,
    ORDER_STATUSES.DELIVERED
  ];
  if (target === ORDER_STATUSES.CANCELLED) return [ORDER_STATUSES.PENDING, ORDER_STATUSES.CANCELLED];
  if (target === ORDER_STATUSES.REJECTED) return [ORDER_STATUSES.PENDING, ORDER_STATUSES.REJECTED];
  const idx = full.indexOf(target);
  return full.slice(0, idx + 1);
};

const clearData = async () => {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await OrderStatusHistory.destroy({ where: {}, truncate: true });
  await Notification.destroy({ where: {}, truncate: true });
  await Delivery.destroy({ where: {}, truncate: true });
  await Payment.destroy({ where: {}, truncate: true });
  await OrderItem.destroy({ where: {}, truncate: true });
  await Order.destroy({ where: {}, truncate: true });
  await Address.destroy({ where: {}, truncate: true });
  await FoodItem.destroy({ where: {}, truncate: true, force: true });
  await Category.destroy({ where: {}, truncate: true, force: true });
  await RestaurantStaff.destroy({ where: {}, truncate: true });
  await Rider.destroy({ where: {}, truncate: true });
  await Customer.destroy({ where: {}, truncate: true });
  await Restaurant.destroy({ where: {}, truncate: true, force: true });
  await User.destroy({ where: {}, truncate: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
};

const createDemoUsers = async () => {
  const imageDir = ensureImageDir();
  const passwordHash = await hash(SEED_PASSWORD);

  const admin = await User.create({
    firstName: 'Fatima', lastName: 'Aminu (Admin)',
    email: 'admin@gidieats.ng', phone: '08030000001',
    passwordHash, role: ROLES.ADMIN, avatar: writePlaceholder(imageDir, 'Admin')
  });

  // 32 customers (Northern / Kano names)
  const customers: User[] = [];
  const usedEmails = new Set<string>();
  for (let i = 0; i < 32; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, '')}${i}@gmail.com`;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    const user = await User.create({
      firstName: first, lastName: last, email,
      phone: `080${randInt(30000000, 59999999)}`,
      passwordHash,
      role: ROLES.CUSTOMER
    });
    customers.push(user);
    await Customer.create({
      userId: user.id,
      loyaltyPoints: randInt(0, 150),
      preferredPaymentMethod: Math.random() > 0.2 ? PAYMENT_METHODS.CARD : PAYMENT_METHODS.CASH
    });
  }

  // Primary demo customer: Fatima Adam Aminu (BUK Student)
  const mainCustomer = customers[0];
  await mainCustomer.update({
    firstName: 'Fatima',
    lastName: 'Adam Aminu',
    email: 'customer@gidieats.ng'
  });

  // Dedicated manager accounts for all 10 Kano restaurants (easy logins)
  const restaurantManagerLogins = [
    { email: 'pecancity@gidieats.ng', firstName: 'Pecancity', lastName: 'Manager' },
    { email: 'bbtreats@gidieats.ng', firstName: 'BBTreats', lastName: 'Manager' },
    { email: 'thecooks@gidieats.ng', firstName: 'TheCooks', lastName: 'Manager' },
    { email: 'taybah@gidieats.ng', firstName: 'Taybah', lastName: 'Manager' },
    { email: 'frenchies@gidieats.ng', firstName: 'Frenchies', lastName: 'Manager' },
    { email: 'anisa@gidieats.ng', firstName: 'Anisa', lastName: 'Manager' },
    { email: 'kfc@gidieats.ng', firstName: 'KFC', lastName: 'Manager' },
    { email: 'royaltaste@gidieats.ng', firstName: 'RoyalTaste', lastName: 'Manager' },
    { email: 'deeroyale@gidieats.ng', firstName: 'DeeRoyale', lastName: 'Manager' },
    { email: 'katforex@gidieats.ng', firstName: 'Katforex', lastName: 'Manager' }
  ];

  const managerUsers: User[] = [];
  for (const m of restaurantManagerLogins) {
    const user = await User.create({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      phone: `090${randInt(30000000, 59999999)}`,
      passwordHash,
      role: ROLES.RESTAFF
    });
    managerUsers.push(user);
  }

  // Numbered staff accounts staff1..staff10 for kitchen chefs
  const staffUsers: User[] = [];
  for (let i = 0; i < 10; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const user = await User.create({
      firstName: first, lastName: last,
      email: `staff${i + 1}@gidieats.ng`,
      phone: `090${randInt(30000000, 59999999)}`,
      passwordHash,
      role: ROLES.RESTAFF
    });
    staffUsers.push(user);
  }

  // 15 riders (riders 1-10 dedicated to the 10 restaurants; riders 11-15 freelance/unlinked)
  const riders: Rider[] = [];
  const riderUsers: User[] = [];
  for (let i = 0; i < 15; i++) {
    const isDedicated = i < 10;
    const first = isDedicated ? restaurantSeeds[i].name.split(' ')[0] : pick(firstNames);
    const last = isDedicated ? 'Rider (Dedicated)' : pick(lastNames);
    const user = await User.create({
      firstName: first, lastName: last,
      email: `rider${i + 1}@gidieats.ng`,
      phone: `081${randInt(30000000, 59999999)}`,
      passwordHash,
      role: ROLES.RIDER
    });
    riderUsers.push(user);
    const rider = await Rider.create({
      userId: user.id,
      restaurantId: null, // will link to restaurant after restaurants exist
      vehicleType: Math.random() > 0.75 ? VEHICLE_TYPES.CAR : VEHICLE_TYPES.MOTORCYCLE,
      licensePlate: `KAN-${randInt(100, 999)}-${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`,
      availabilityStatus: 'AVAILABLE',
      totalDeliveries: randInt(5, 75),
      rating: naira(rand(3.8, 5.0)),
      ratingCount: randInt(10, 220)
    });
    riders.push(rider);
  }

  return { admin, customers, customerUserToId: () => customers, managerUsers, staffUsers, riderUsers, riders };
};

const seedRestaurantsAndMenu = async () => {
  const imageDir = ensureImageDir();
  const restaurants: Restaurant[] = [];
  const categories: Category[] = [];
  const foodItems: FoodItem[] = [];

  for (const r of restaurantSeeds) {
    const restaurant = await Restaurant.create({
      name: r.name,
      slug: r.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-'),
      description: `Home of the finest ${r.cuisineType.toLowerCase()} in ${r.city}, Kano (near BUK). Popular spot among Bayero University Kano students and locals.`,
      phone: r.phone,
      email: `${r.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-')}@gidieats.ng`,
      addressStreet: r.street,
      addressCity: r.city,
      addressState: r.state,
      logo: photoIfExists(imageDir, `logo-${photoSlug(r.name)}`) ?? photoIfExists(imageDir, `cover-${photoSlug(r.name)}`) ?? writePlaceholder(imageDir, r.name + ' Logo'),
      coverImage: photoIfExists(imageDir, `cover-${photoSlug(r.name)}`) ?? writePlaceholder(imageDir, r.name + ' Cover'),
      cuisineType: r.cuisineType,
      deliveryFee: r.deliveryFee,
      deliveryTimeMin: r.deliveryTimeMin,
      rating: r.rating ?? naira(rand(4.0, 4.8)),
      ratingCount: r.ratingCount ?? randInt(20, 200),
      approvalStatus: 'APPROVED',
      isActive: true,
      opensAt: r.opensAt,
      closesAt: r.closesAt
    });
    restaurants.push(restaurant);

    const groups = menuSeeds[r.name] ?? [];
    let sortIndex = 0;
    for (const group of groups) {
      const category = await Category.create({
        restaurantId: restaurant.id,
        name: group.name,
        description: group.description,
        image: photoIfExists(imageDir, photoSlug(group.name)) ?? writePlaceholder(imageDir, group.name),
        sortOrder: sortIndex++,
        isActive: true
      });
      categories.push(category);

      for (const item of group.items) {
        const food = await FoodItem.create({
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: photoIfExists(imageDir, photoSlug(item.name)) ?? writePlaceholder(imageDir, item.name),
          isAvailable: true,
          isFeatured: Math.random() > 0.65,
          preparationTimeMin: randInt(12, 30),
          rating: naira(rand(3.8, 5.0)),
          ratingCount: randInt(5, 120)
        });
        foodItems.push(food);
      }
    }
  }

  return { restaurants, categories, foodItems };
};

const seedAddresses = async (customers: User[]) => {
  const addresses: Address[] = [];
  for (let i = 0; i < customers.length; i++) {
    const customer = await Customer.findOne({ where: { userId: customers[i].id } });
    if (!customer) continue;
    const count = i % 3 === 0 ? 2 : 1;
    for (let a = 0; a < count; a++) {
      const addr = await Address.create({
        customerId: customer.id,
        label: a === 0 ? (i === 0 ? 'BUK Hostel (Nana Hall)' : 'Home') : 'Campus / Department',
        street: `${NEIGHBORHOODS[randInt(0, NEIGHBORHOODS.length - 1)]}, ${STREETS[randInt(0, STREETS.length - 1)]}`,
        city: pick(CITIES),
        state: 'Kano',
        postalCode: `${randInt(700201, 700282)}`,
        phone: customers[i].phone,
        isDefault: a === 0
      });
      addresses.push(addr);
    }
  }
  return addresses;
};

const seedOrders = async (ctx: {
  restaurants: Restaurant[];
  customers: User[];
  categories: Category[];
  foodItems: FoodItem[];
  riderUsers: User[];
  riders: Rider[];
  staffUsers: User[];
}) => {
  const placeStaff = async (restaurantId: number) => {
    const staff = await RestaurantStaff.findAll({ where: { restaurantId } });
    return staff;
  };

  let orderCount = 0;
  // 12 orders per restaurant * 10 restaurants = 120 total orders
  const ordersPerRestaurant = 12;
  for (const restaurant of ctx.restaurants) {
    const thisRestaurantFood = ctx.foodItems.filter((f) => f.restaurantId === restaurant.id);
    if (thisRestaurantFood.length === 0) continue;

    for (let o = 0; o < ordersPerRestaurant; o++) {
      const customerUser = pick(ctx.customers);
      const customer = (await Customer.findOne({ where: { userId: customerUser.id } }))!;
      const addresses = await Address.findAll({ where: { customerId: customer.id } });
      const address = addresses[0];

      const plan = orderStatusPlan();
      const targetStatus = plan.status;

      const itemCount = randInt(1, 3);
      const selected = [...thisRestaurantFood].sort(() => Math.random() - 0.5).slice(0, itemCount);
      const items = selected.map((f) => ({ foodItemId: f.id, quantity: randInt(1, 2) }));
      const placedDaysAgo = randInt(0, 45);
      const placedAt = daysAgo(placedDaysAgo);
      const paymentMethod = Math.random() > 0.25 ? PAYMENT_METHODS.CARD : PAYMENT_METHODS.CASH;

      const subtotal = naira(items.reduce((sum, it) => {
        const food = ctx.foodItems.find((f) => f.id === it.foodItemId)!;
        return sum + Number(food.price) * it.quantity;
      }, 0));
      const deliveryFee = Number(restaurant.deliveryFee);
      const serviceFee = naira(subtotal * 0.05);
      const total = naira(subtotal + deliveryFee + serviceFee);

      const orderNumber = `SEED${String(100000 + orderCount)}`;

      const order = await Order.create({
        orderNumber,
        customerId: customer.id,
        restaurantId: restaurant.id,
        addressId: address?.id ?? null,
        deliveryAddress: address ? JSON.stringify({
          name: `${customerUser.firstName} ${customerUser.lastName}`,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state
        }) : null,
        status: targetStatus,
        subtotal, deliveryFee, serviceFee, discount: 0, total,
        paymentMethod,
        specialInstructions: Math.random() > 0.75 ? 'Please deliver to BUK New Site security post.' : null,
        placedAt,
        confirmedAt: targetStatus !== ORDER_STATUSES.PENDING && targetStatus !== ORDER_STATUSES.CANCELLED && targetStatus !== ORDER_STATUSES.REJECTED ? new Date(placedAt.getTime() + randInt(2, 15) * 60000) : null,
        preparingAt: ([ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.RIDER_ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(placedAt.getTime() + randInt(15, 30) * 60000) : null,
        readyAt: ([ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.RIDER_ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(placedAt.getTime() + randInt(30, 45) * 60000) : null,
        riderAssignedAt: ([ORDER_STATUSES.RIDER_ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(placedAt.getTime() + randInt(35, 50) * 60000) : null,
        pickedUpAt: ([ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(placedAt.getTime() + randInt(45, 60) * 60000) : null,
        deliveredAt: targetStatus === ORDER_STATUSES.DELIVERED ? new Date(placedAt.getTime() + randInt(55, 80) * 60000) : null,
        rejectedAt: targetStatus === ORDER_STATUSES.REJECTED ? new Date(placedAt.getTime() + randInt(5, 20) * 60000) : null,
        cancelledAt: targetStatus === ORDER_STATUSES.CANCELLED ? new Date(placedAt.getTime() + randInt(5, 30) * 60000) : null,
        rejectionReason: targetStatus === ORDER_STATUSES.REJECTED ? 'Kitchen reached full capacity during peak BUK lecture hours' : null,
        cancelReason: targetStatus === ORDER_STATUSES.CANCELLED ? 'Customer rescheduled delivery' : null
      });
      orderCount++;

      await Promise.all(items.map(async (it) => {
        const food = ctx.foodItems.find((f) => f.id === it.foodItemId)!;
        return OrderItem.create({
          orderId: order.id,
          foodItemId: food.id,
          name: food.name,
          price: Number(food.price),
          quantity: it.quantity,
          subtotal: naira(Number(food.price) * it.quantity)
        });
      }));

      // Payment
      let payStatus: string;
      let paidAt: Date | null = null;
      const isPaidStatus = ([ORDER_STATUSES.RIDER_ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus);
      if (isPaidStatus) {
        payStatus = PAYMENT_STATUSES.SUCCESS;
        paidAt = new Date(placedAt.getTime() + randInt(1, 8) * 60000);
      } else if (targetStatus === ORDER_STATUSES.CANCELLED || targetStatus === ORDER_STATUSES.REJECTED) {
        payStatus = paymentMethod === PAYMENT_METHODS.CASH ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.REFUNDED;
      } else {
        payStatus = PAYMENT_STATUSES.PENDING;
      }

      await Payment.create({
        orderId: order.id,
        amount: total,
        method: paymentMethod,
        status: payStatus as never,
        reference: `FLW-SEED-${orderNumber}`,
        provider: paymentMethod === PAYMENT_METHODS.CASH ? 'CASH' : 'FLUTTERWAVE',
        transactionId: isPaidStatus ? `flw_txn_${orderNumber}` : null,
        paidAt
      });

      // Delivery if progressed
      let delivery: Delivery | null = null;
      if (([ORDER_STATUSES.RIDER_ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus)) {
        const restaurantIdx = ctx.restaurants.findIndex((r) => r.id === restaurant.id);
        // 75% dedicated rider of this restaurant, 25% freelance rider
        const rider = (Math.random() > 0.25 && restaurantIdx >= 0 && restaurantIdx < 10)
          ? ctx.riders[restaurantIdx]
          : pick(ctx.riders.slice(10));

        const assignedAt = order.riderAssignedAt!;
        delivery = await Delivery.create({
          orderId: order.id,
          riderId: rider.id,
          status: targetStatus === ORDER_STATUSES.RIDER_ASSIGNED ? 'ASSIGNED'
            : targetStatus === ORDER_STATUSES.PICKED_UP ? 'PICKED_UP'
            : targetStatus === ORDER_STATUSES.OUT_FOR_DELIVERY ? 'OUT_FOR_DELIVERY' : 'DELIVERED',
          assignedAt,
          acceptedAt: ([ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(assignedAt.getTime() + randInt(2, 6) * 60000) : null,
          pickedUpAt: ([ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED] as string[]).includes(targetStatus) ? new Date(assignedAt.getTime() + randInt(6, 15) * 60000) : null,
          deliveredAt: targetStatus === ORDER_STATUSES.DELIVERED ? order.deliveredAt : null
        });
        await order.update({ riderId: rider.id });
        await rider.update({ totalDeliveries: rider.totalDeliveries + (targetStatus === ORDER_STATUSES.DELIVERED ? 1 : 0) });
      }

      // Status history
      const path = statusHistoryPath(targetStatus);
      for (let p = 0; p < path.length; p++) {
        await OrderStatusHistory.create({
          orderId: order.id,
          fromStatus: p === 0 ? null : path[p - 1],
          toStatus: path[p],
          note: path[p] === ORDER_STATUSES.PENDING ? 'Order placed' : undefined
        });
      }

      // Notifications
      const customerNotifs: { title: string; message: string; type: string; orderId: number }[] = [];
      customerNotifs.push({ title: 'Order received', message: `Your order ${orderNumber} has been placed and is awaiting confirmation.`, type: 'ORDER', orderId: order.id });
      if (['PENDING', 'CANCELLED', 'REJECTED'].includes(targetStatus)) customerNotifs.push({ title: 'Payment pending', message: `Payment of ₦${total.toLocaleString()} for ${orderNumber} pending.`, type: 'PAYMENT', orderId: order.id });
      if (path.length >= 2 && targetStatus !== ORDER_STATUSES.CANCELLED && targetStatus !== ORDER_STATUSES.REJECTED) customerNotifs.push({ title: 'Order accepted', message: `${restaurant.name} accepted your order ${orderNumber}.`, type: 'ORDER', orderId: order.id });
      if (path.length >= 3) customerNotifs.push({ title: 'Order being prepared', message: `${orderNumber} is being prepared in the kitchen.`, type: 'ORDER', orderId: order.id });
      if (path.length >= 4) customerNotifs.push({ title: 'Order ready for pickup', message: `${orderNumber} is packaged and ready for pickup.`, type: 'ORDER', orderId: order.id });
      if (path.length >= 5 && delivery) customerNotifs.push({ title: 'Rider assigned', message: `Rider assigned to ${orderNumber}.`, type: 'ORDER', orderId: order.id });
      if (path.length >= 6 && delivery) customerNotifs.push({ title: 'Order picked up', message: `${orderNumber} has been picked up by the rider.`, type: 'ORDER', orderId: order.id });
      if (path.length >= 7 && delivery) customerNotifs.push({ title: 'Out for delivery', message: `${orderNumber} is on its way to your BUK / Kano location.`, type: 'ORDER', orderId: order.id });
      if (targetStatus === ORDER_STATUSES.DELIVERED) customerNotifs.push({ title: 'Order delivered', message: `${orderNumber} has been delivered. Enjoy your meal!`, type: 'ORDER', orderId: order.id });
      if (isPaidStatus) customerNotifs.push({ title: 'Payment successful', message: `Payment of ₦${total.toLocaleString()} for ${orderNumber} via Flutterwave was successful.`, type: 'PAYMENT', orderId: order.id });

      for (const n of customerNotifs) {
        await Notification.create({
          userId: customerUser.id,
          title: n.title,
          message: n.message,
          type: n.type as never,
          orderId: n.orderId,
          createdAt: new Date(placedAt.getTime() + randInt(1, 60) * 60000)
        });
      }
    }
  }

  // Staff and rider system notifications
  const allStaff = await RestaurantStaff.findAll();
  for (const s of allStaff) {
    await Notification.create({
      userId: s.userId,
      title: 'Welcome to GidiEats BUK & Kano',
      message: 'Manage orders, review Flutterwave payments and track kitchen prep from your dashboard.',
      type: 'SYSTEM'
    });
  }
  const riders = ctx.riders;
  for (const r of riders) {
    await Notification.create({
      userId: r.userId,
      title: 'Ready for campus deliveries',
      message: 'New deliveries near BUK New Site & Danbare will appear here. Automatic payout credited on delivery.',
      type: 'SYSTEM'
    });
  }
};

const main = async () => {
  console.log('🌱 Seeding GidiEats Kano / BUK database for Fatima Adam Aminu...');
  const t0 = Date.now();
  await testDb();
  ensureImageDir();

  console.log('  Clearing existing data...');
  await clearData();

  console.log('  Creating users (admin, 32 customers, 24 staff, 15 riders)...');
  const demoUsers = await createDemoUsers();

  console.log('  Creating 10 Kano / BUK restaurants, categories and food items...');
  const menu = await seedRestaurantsAndMenu();

  console.log('  Linking restaurant staff and dedicated riders...');
  for (let i = 0; i < menu.restaurants.length; i++) {
    const r = menu.restaurants[i];
    // Link primary manager (e.g. pecancity@gidieats.ng)
    await RestaurantStaff.create({ userId: demoUsers.managerUsers[i].id, restaurantId: r.id, position: 'MANAGER', isPrimary: true });
    // Link kitchen chef / staff (e.g. staff1@gidieats.ng)
    await RestaurantStaff.create({ userId: demoUsers.staffUsers[i].id, restaurantId: r.id, position: 'CHEF', isPrimary: false });
    // Link dedicated in-house rider (e.g. rider1@gidieats.ng -> Pecancity)
    if (i < 10 && demoUsers.riders[i]) {
      await demoUsers.riders[i].update({ restaurantId: r.id });
    }
  }

  console.log('  Creating customer addresses in Kano & BUK New Site...');
  await seedAddresses(demoUsers.customers);

  console.log('  Creating 120 orders with items, payments, deliveries & notifications...');
  await seedOrders({
    restaurants: menu.restaurants,
    customers: demoUsers.customers,
    categories: menu.categories,
    foodItems: menu.foodItems,
    riderUsers: demoUsers.riderUsers,
    riders: demoUsers.riders,
    staffUsers: [...demoUsers.managerUsers, ...demoUsers.staffUsers]
  });

  // Update customer aggregate stats
  const agg = await Order.findAll({
    attributes: [
      'customerId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'cnt'],
      [sequelize.fn('SUM', sequelize.col('total')), 'spent']
    ],
    group: ['customerId']
  });
  for (const row of agg) {
    const customer = await Customer.findByPk(row.get('customerId') as number);
    if (customer) {
      await customer.update({
        totalOrders: Number(row.get('cnt')),
        totalSpend: Number(row.get('spent') ?? 0)
      });
    }
  }

  await sequelize.close();
  console.log(`✅ Seeding complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('');
  console.log('BUK Project Student: Fatima Adam Aminu (Bayero University Kano)');
  console.log('===========================================================');
  console.log(`Demo Accounts (Password for all accounts: ${SEED_PASSWORD})`);
  console.log('===========================================================');
  console.log('👑 Admin:');
  console.log('   - admin@gidieats.ng (Fatima Aminu)');
  console.log('');
  console.log('🎓 Customer:');
  console.log('   - customer@gidieats.ng (Fatima Adam Aminu - BUK Student)');
  console.log('');
  console.log('🏢 Restaurant Logins (All 10 Kano Spots):');
  console.log('   1.  Pecancity:   pecancity@gidieats.ng  / staff1@gidieats.ng');
  console.log('   2.  B-B Treats:  bbtreats@gidieats.ng   / staff2@gidieats.ng');
  console.log('   3.  The Cooks:   thecooks@gidieats.ng   / staff3@gidieats.ng');
  console.log('   4.  TAYBAH:      taybah@gidieats.ng     / staff4@gidieats.ng');
  console.log('   5.  Frenchies:   frenchies@gidieats.ng  / staff5@gidieats.ng');
  console.log('   6.  Anisa:       anisa@gidieats.ng      / staff6@gidieats.ng');
  console.log('   7.  KFC Kabuga:  kfc@gidieats.ng        / staff7@gidieats.ng');
  console.log('   8.  Royal Taste: royaltaste@gidieats.ng / staff8@gidieats.ng');
  console.log('   9.  Dee_Royale:  deeroyale@gidieats.ng  / staff9@gidieats.ng');
  console.log('   10. Katforex:    katforex@gidieats.ng   / staff10@gidieats.ng');
  console.log('');
  console.log('🚴 Dedicated In-House Riders:');
  console.log('   - rider1@gidieats.ng  -> Linked to Pecancity Restaurant');
  console.log('   - rider2@gidieats.ng  -> Linked to B-B Treats');
  console.log('   - rider3@gidieats.ng  -> Linked to The Cooks Restaurant');
  console.log('   - rider4@gidieats.ng  -> Linked to TAYBAH Restaurant');
  console.log('   - rider5@gidieats.ng  -> Linked to Frenchies Restaurant');
  console.log('   - rider6@gidieats.ng  -> Linked to Anisa Restaurant');
  console.log('   - rider7@gidieats.ng  -> Linked to KFC Kabuga');
  console.log('   - rider8@gidieats.ng  -> Linked to Royal Taste Restaurant');
  console.log('   - rider9@gidieats.ng  -> Linked to Dee_Royale Eatery');
  console.log('   - rider10@gidieats.ng -> Linked to Katforex Restaurant');
  console.log('');
  console.log('🌐 Freelance / Platform-wide Riders (Unlinked):');
  console.log('   - rider11@gidieats.ng .. rider15@gidieats.ng (Independent Riders)');
  console.log('===========================================================');
};

const testDb = async () => {
  try {
    await sequelize.authenticate();
  } catch {
    console.error('Could not connect to MySQL. Please ensure MySQL is running and backend/.env has the right credentials (run `npm run db:create` first).');
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
