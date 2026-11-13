import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_UPLOADS = path.resolve(__dirname, '../uploads');
const FRONTEND_UPLOADS = path.resolve(__dirname, '../../frontend/public/uploads');

fs.mkdirSync(BACKEND_UPLOADS, { recursive: true });
fs.mkdirSync(FRONTEND_UPLOADS, { recursive: true });

const RESTAURANT_IMAGES = {
  1: { // Pecancity Restaurant & Game Lounge
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8LMnxD6Adnivk91PWOXnXoOx5ro1kWbkRvZc_2lOn2w&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9TlyTzhqMdQqpnOZ3pHU9oUxmXJ9YhzrWY0j0fsIfsg&s=10'
  },
  2: { // B-B Treats
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGKg-X9nDskxG5CM1sJSEbkZRCEDYvOUFfE5-PPFCwkQ&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGKg-X9nDskxG5CM1sJSEbkZRCEDYvOUFfE5-PPFCwkQ&s=10'
  },
  3: { // The Cooks Restaurant
    cover: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80'
  },
  4: { // TAYBAH Restaurant
    cover: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&auto=format&fit=crop&q=80',
    logo: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80'
  },
  5: { // Frenchies Restaurant
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9QiJKQmvGQ5YQ5Dvjd91L9xJtwr1JkjlSCw1dbX2qbg&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9QiJKQmvGQ5YQ5Dvjd91L9xJtwr1JkjlSCw1dbX2qbg&s=10'
  },
  6: { // Anisa Restaurant and Lounge
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSiHE9f8AVNn43Nn2qPf3oQkNGJCFpbOwzdcO6hAukRg&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSiHE9f8AVNn43Nn2qPf3oQkNGJCFpbOwzdcO6hAukRg&s=10'
  },
  7: { // KFC Kabuga (BUK / Kano 2)
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-H-C9GAHXYZyxenZ-HChsbSaoCzIzpkc8_QDDZtkAokseHeX-hF4YBI&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-H-C9GAHXYZyxenZ-HChsbSaoCzIzpkc8_QDDZtkAokseHeX-hF4YBI&s=10'
  },
  8: { // Royal Taste Restaurant
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-H-C9GAHXYZyxenZ-HChsbSaoCzIzpkc8_QDDZtkAokseHeX-hF4YBI&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-H-C9GAHXYZyxenZ-HChsbSaoCzIzpkc8_QDDZtkAokseHeX-hF4YBI&s=10'
  },
  9: { // Dee_Royale Eatery N Restaurant
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKQrJp_H45_PSz1VdstFn7pnVsMzn6S0lluDisxwb5TQ5-3hFM5VyL3mhf&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKQrJp_H45_PSz1VdstFn7pnVsMzn6S0lluDisxwb5TQ5-3hFM5VyL3mhf&s=10'
  },
  10: { // Katforex Restaurant
    cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3UBb-xMV-H-9QY2xI7GJnETjOqoQwWheKka63Gfjt4252jzs6xrNM1PZF&s=10',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRI_IbMDLv44kLg2MHKc_oJFg8khj8DoYQFQuXn69Nag&s'
  }
};

// High-resolution real food pictures
const FOOD_IMAGE_MAP = {
  // Swallows & Traditional Soups
  'Pounded Yam with Egusi & Goat Meat': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Pounded_Yam_and_Egusi_Soup.jpg',
  'Amala with Ewedu, Gbegiri & Tender Beef': 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Amala_ati_Ewedu_and_Ogunfe.png',
  'Tuwon Shinkafa & Miyan Taushe': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Tuwo_Shinkafa_with_Mia_Kuka_and_Beef.jpg',
  'Tuwo Da Miyan Kuka with Cow Tail': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Tuwo_Shinkafa_with_Mia_Kuka_and_Beef.jpg',
  'Tuwo Da Miyan Kuka with Slow-Cooked Beef': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Tuwo_Shinkafa_with_Mia_Kuka_and_Beef.jpg',
  'Semovita with Bitterleaf & Assorted Meat': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Pounded_Yam_and_Egusi_Soup.jpg',
  
  // Rice Dishes
  'Party Jollof Rice with Fried Chicken': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Jollof_rice_with_fried_chicken_and_vegetables.jpg',
  'Party Jollof Rice with Boiled Egg & Dodo': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Jollof_rice_with_boiled_egg_and_fried_chicken.jpg',
  'Danbare Special Jollof Rice & Beef': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Jollof_rice_with_fried_chicken_and_vegetables.jpg',
  'The Cooks Jollof Rice with Peppered Turkey': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Jollof_rice_with_fried_chicken_and_vegetables.jpg',
  'Colonel’s Jollof Rice Bowl with Crispy Strips': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Jollof_rice_with_fried_chicken_and_vegetables.jpg',
  'Pecan Special Fried Rice with Beef': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  'Danbare Student Fried Rice & Chicken': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  'Fried Rice with Peppered Quarter Chicken': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  'Dee_Royale Chinese Fried Rice & Sauced Chicken': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
  'Special Egg & Shrimp Fried Rice Plate': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
  'Crispy Sweet & Sour Chicken with Fried Rice': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=80',
  'Arabian Chicken Mandi Rice with Garlic Sauce': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  'Lamb Kabsa Rice with Spiced Gravy': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  'Danbare Quick Bento Rice with Fried Fish': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  'White Rice & Native Pepper Stew with Beef': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',

  // Grills, Suya & Seafood
  'Spicy Peppered Whole Catfish': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
  'Frenchies Pan-Seared Salmon with Asparagus': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
  'Charcoal Grilled Quarter Chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&auto=format&fit=crop&q=80',
  'Quarter Grilled Chicken with Spicy Potato Chips': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&auto=format&fit=crop&q=80',
  'Asun Spicy Goat Meat Platter': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Suya_and_Apples.jpg',
  'Spicy Boneless Chicken Suya Platter': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  'Royal Spiced Beef Kebabs (5 Skewers)': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  'Taybah Mixed Grill Platter (Beef, Chicken & Kebab)': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  'Grilled Peppered Gizzard & Plantain': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
  'Grilled Ribeye Steak with Herb Butter & Mash': 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80',
  'Executive Mixed Fried Rice & Grilled Jumbo Prawns': 'https://images.unsplash.com/photo-1559737558-245cb3897b77?w=800&auto=format&fit=crop&q=80',

  // Yams, Fries & Fast Food
  'Golden Fried Yam & Pepper Sauce with Egg': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
  'Golden Sweet Potato Chips & Fried Egg': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
  'Fried Plantain (Dodo) Portion': 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Dodo_and_eggs.jpg',
  'Crispy French Fries & Chicken Drumstick': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
  'Loaded Cheesy French Fries with Shredded Beef': 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=80',

  // Crispy Chicken & Buckets
  '5pc Hot & Crispy Chicken Bucket': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
  '10pc Crispy Drumsticks & Thighs Feast': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
  '3pc Chicken & Large Fries Combo': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
  'Crispy Fried Chicken & French Fries': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
  'Crispy Popcorn Chicken & Fries': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
  'Crispy Buffalo Chicken Wings (8 pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',
  'Spicy BBQ Glazed Crispy Wings (8 pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',
  'Spicy Chicken Wings (6 pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',
  'Spicy Garlic Parmesan Wings with Ranch Dip (8 pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&auto=format&fit=crop&q=80',

  // Burgers & Sandwiches
  'B-B Jumbo Beef Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Anisa Double Cheeseburger & Seasoned Chips': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Royal Taste House Special Burger & Chips': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Loaded Cheesy Beef Burger with Crispy Onion Rings': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Zinger Burger Combo with Fries & Drink': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  'Crispy Buttermilk Chicken Burger': 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
  'Triple Decker Club Sandwich with Fries': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',

  // Shawarma & Wraps
  'Katforex Jumbo Beef Shawarma with Melted Cheese': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'Katforex Double Sausage & Chicken Shawarma': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'Classic Chicken Shawarma with Garlic Mayo': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'Arabic Beef Shawarma with Tahini & Pickles': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'B-B Chicken Shawarma (Single)': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'Gourmet Frenchies Jumbo Shawarma': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  'Authentic Crispy Falafel Wrap with Hummus': 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?w=800&auto=format&fit=crop&q=80',
  'Dee_Royale Crunchy Chicken Wrap': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',

  // Middle Eastern Specialties
  'Creamy Hummus with Fresh Pita Bread': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=800&auto=format&fit=crop&q=80',
  'Tabbouleh Fresh Herb Salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',

  // Pizzas & Italian
  'Frenchies Deluxe Pepperoni Pizza (Large)': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
  'Signature BBQ Beef & Chicken Supreme Pizza (Large)': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  'Quattro Formaggi Four-Cheese Pizza (Large)': 'https://images.unsplash.com/photo-1573821663912-569905455b1a?w=800&auto=format&fit=crop&q=80',
  'Creamy Chicken & Mushroom Penne Pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d62817ee?w=800&auto=format&fit=crop&q=80',
  'Stir-fry Chicken Egg Noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
  'Stir-fry Beef Spaghetti': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',

  // Pastries & Finger Foods
  'Flaky Beef Meat Pie & Soft Drink': 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Nigerian_meat_pie.jpg',
  'Crispy Spring Rolls & Samosa Combo': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  'Crispy Spring Rolls & Samosa Platter (6 pcs)': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  'KFC Signature Coleslaw Bowl': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',

  // Traditional & Refreshing Drinks
  'Chilled Zobo with Ginger & Clove': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Zobo_drink.jpg',
  'Chilled Fresh Zobo Juice': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Zobo_drink.jpg',
  'Chilled Zobo with Fresh Mint': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Zobo_drink.jpg',
  'The Cooks Classic Chapman': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Classic Chapman with Angostura Bitters': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Pecan Signature Mocktail': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
  'Taybah Special Shisha Lounge Mocktail': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
  'Fresh Mint Lemonade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Iced Peach Tea / Lemonade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Iced Lemon & Mint Tea': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Freshly Blended Apple & Orange Cocktail': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80',
  'Spiced Arabic Karak Chai Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  'Traditional Turkish Coffee Pot': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
  'Special Spiced Hot Tea Pot (Kano Blend)': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',

  // Shakes, Smoothies & Desserts
  'Fresh Strawberry & Banana Smoothie': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80',
  'Mango Passionfruit Slush': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800&auto=format&fit=crop&q=80',
  'Oreo Vanilla Thick Milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
  'Strawberry Cream Frappé': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
  'Artisanal French Bakery Pastry Box (4 pcs)': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  'Belgian Chocolate & Pistachio Gelato Tub': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80',
  'Classic Italian Tiramisu Cake Slice': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
  'Cold Soft Drink (500ml)': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
  'Chilled Pepsi 500ml Bottle': 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&auto=format&fit=crop&q=80'
};

const photoSlug = (name) =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

async function downloadImage(url, destBase) {
  const backendFile = path.join(BACKEND_UPLOADS, `${destBase}.jpg`);
  const frontendFile = path.join(FRONTEND_UPLOADS, `${destBase}.jpg`);
  
  // Skip if already downloaded and size > 5KB
  if (fs.existsSync(backendFile) && fs.statSync(backendFile).size > 5000) {
    if (!fs.existsSync(frontendFile)) {
      fs.copyFileSync(backendFile, frontendFile);
    }
    return `/uploads/${destBase}.jpg`;
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'GidiEats/1.0 (Food delivery photo fetch; contact: dev@gidieats.ng)' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error('Downloaded buffer too small');
    fs.writeFileSync(backendFile, buf);
    fs.writeFileSync(frontendFile, buf);
    return `/uploads/${destBase}.jpg`;
  } catch (err) {
    console.warn(`  [FAIL] Failed to download ${destBase} from ${url}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🖼️ Fetching online food & restaurant pictures for Kano / BUK...');
  
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gidieats'
  });

  // 1. Process Restaurants (Covers & Logos)
  console.log('\n--- 1. Processing 10 Kano Restaurants Covers & Logos ---');
  const [restaurants] = await db.query('SELECT id, name FROM restaurants ORDER BY id ASC');
  for (const r of restaurants) {
    const spec = RESTAURANT_IMAGES[r.id];
    if (!spec) continue;
    const coverSlug = `cover-${photoSlug(r.name)}`;
    const logoSlug = `logo-${photoSlug(r.name)}`;
    
    console.log(`  Restaurant ${r.id}: ${r.name}`);
    const coverPath = await downloadImage(spec.cover, coverSlug);
    const logoPath = await downloadImage(spec.logo, logoSlug);

    if (coverPath || logoPath) {
      await db.query(
        'UPDATE restaurants SET cover_image = ?, logo = ? WHERE id = ?',
        [coverPath || `/uploads/${coverSlug}.jpg`, logoPath || `/uploads/${logoSlug}.jpg`, r.id]
      );
      console.log(`    ✓ Cover & Logo updated in database`);
    }
  }

  // 2. Process Food Items
  console.log('\n--- 2. Processing 96 Food Items Photos ---');
  const [items] = await db.query('SELECT id, name FROM food_items ORDER BY id ASC');
  let updatedCount = 0;
  for (const item of items) {
    let url = FOOD_IMAGE_MAP[item.name];
    if (!url) {
      // Fallback matching
      const found = Object.keys(FOOD_IMAGE_MAP).find(k => 
        item.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(item.name.toLowerCase())
      );
      url = found ? FOOD_IMAGE_MAP[found] : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';
    }
    const slug = photoSlug(item.name);
    const imgPath = await downloadImage(url, slug);
    if (imgPath) {
      await db.query('UPDATE food_items SET image = ? WHERE id = ?', [imgPath, item.id]);
      updatedCount++;
      process.stdout.write(`  [${updatedCount}/${items.length}] ${item.name}\r`);
    }
  }
  console.log(`\n\n✅ Successfully downloaded and assigned photos to ${updatedCount}/${items.length} food items and all 10 restaurants!`);
  await db.end();
}

main().catch(console.error);

