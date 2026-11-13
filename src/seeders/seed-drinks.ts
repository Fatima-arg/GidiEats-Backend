import { Sequelize, DataTypes } from 'sequelize';

export interface DrinkSeedItem {
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface RestaurantDrinkGroup {
  restaurantName: string;
  categoryName: string;
  categoryDescription: string;
  items: DrinkSeedItem[];
}

export const DRINKS_AND_SMOOTHIES_SEED: RestaurantDrinkGroup[] = [
  {
    restaurantName: 'Pecancity Restaurant & Game Lounge',
    categoryName: 'Chilled Drinks & Smoothies',
    categoryDescription: 'Thick fruit smoothies, signature game lounge mocktails and northern thirst quenchers',
    items: [
      {
        name: 'Fresh Mango & Passionfruit Smoothie',
        description: 'Sweet northern mango puree blended with tangy passionfruit, Greek yogurt and crushed ice',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop'
      },
      {
        name: 'Avocado, Banana & Honey Power Smoothie',
        description: 'Rich creamy butter avocado, sweet ripe banana, whole milk and natural honey drizzle',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1638176066666-ffb2f5d22223?w=600&auto=format&fit=crop'
      },
      {
        name: 'Pecan Signature Chilled Zobo with Pineapple',
        description: 'Slow-steeped northern hibiscus flower drink infused with crushed ginger, clove and pineapple juice',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      },
      {
        name: 'Kunu Aya (Tiger Nut Milk with Dates & Coconut)',
        description: 'Traditional cold-pressed tiger nut milk naturally sweetened with dried dates and coconut flakes',
        price: 1000,
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop'
      },
      {
        name: 'Classic Nigerian Chapman (Lounge Special)',
        description: 'Chilled sparkling Fanta and Sprite, splash of Angostura bitters, fresh cucumber wheels and lemon',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'B-B Treats',
    categoryName: 'Smoothies & Fresh Drinks',
    categoryDescription: 'Ice-cold fruit smoothies, student coolers and fresh juices in Danbare BUK New Site',
    items: [
      {
        name: 'Strawberry & Banana Thick Smoothie',
        description: 'Fresh blended sweet red strawberries and bananas with vanilla yogurt and honey',
        price: 1600,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Watermelon & Garden Mint Slush Smoothie',
        description: 'Sweet seedless watermelon chunks blended with fresh garden mint leaves and crushed ice',
        price: 1400,
        image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Chilled Danbare Zobo Juice (500ml)',
        description: 'Authentic Kano hibiscus juice boiled with fresh ginger and sweet pineapple essence',
        price: 700,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      },
      {
        name: 'Creamy Tiger Nut Milk (Kunu Aya with Coconut)',
        description: 'Fresh local tiger nut milk flavored with dried dates and coconut water',
        price: 900,
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop'
      },
      {
        name: 'Cold Soft Drink / Maltina (500ml Bottle/Can)',
        description: 'Chilled bottle of Coca-Cola, Fanta, Sprite, Pepsi or Maltina',
        price: 600,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'The Cooks Restaurant',
    categoryName: 'Fresh Smoothies & Quenchers',
    categoryDescription: 'Energizing smoothies and natural cold juices along Danbare Bypass',
    items: [
      {
        name: 'Tropical Pineapple & Ginger Smoothie',
        description: 'Sweet golden pineapple blended with crushed ice and a fiery touch of northern ginger',
        price: 1600,
        image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop'
      },
      {
        name: 'Creamy Banana & Groundnut Paste Smoothie',
        description: 'Wholesome student energy blend of ripe bananas, peanut butter, whole milk and honey',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'The Cooks Zobo Cooler with Mint',
        description: 'Spiced hibiscus drink with clove, crushed ginger and fragrant mint garnish',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      },
      {
        name: 'The Cooks Signature Chapman Mocktail',
        description: 'Sparkling citrus mocktail with Angostura bitters and sliced cucumber wheels',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'TAYBAH Restaurant',
    categoryName: 'Middle Eastern Coolers & Smoothies',
    categoryDescription: 'Authentic Mediterranean smoothies, Arabian teas and mint coolers',
    items: [
      {
        name: 'Pomegranate & Berry Breeze Smoothie',
        description: 'Rich ruby pomegranate juice blended with wild mixed berries and crushed ice',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Fresh Mint Lemonade (Limonana)',
        description: 'Traditional Middle Eastern frozen slush of fresh lemon juice, garden mint and cane sugar',
        price: 1400,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Creamy Arabian Date & Almond Milkshake',
        description: 'Medjool dates blended with cold milk, crushed almonds and a hint of cinnamon',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop'
      },
      {
        name: 'Spiced Arabic Karak Chai (Iced/Hot)',
        description: 'Strong black tea simmered with cardamom, evaporated milk, saffron and cloves',
        price: 1000,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'Frenchies Restaurant',
    categoryName: 'Artisanal Smoothies & Beverages',
    categoryDescription: 'Gourmet cold-pressed fruit smoothies, detox juices and iced coffees in Kano',
    items: [
      {
        name: 'Frenchies Mixed Berry Velvet Smoothie',
        description: 'Colossal blend of raspberries, blueberries, strawberries and creamy Greek yogurt',
        price: 2800,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Mango, Pineapple & Coconut Cream Smoothie',
        description: 'Sweet tropical mango and pineapple blended smoothly with rich coconut milk',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop'
      },
      {
        name: 'Freshly Pressed Green Detox Juice',
        description: 'Crisp green apples, cucumber, celery, fresh ginger root and fresh lime juice',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop'
      },
      {
        name: 'Artisan Iced Caramel Macchiato',
        description: 'Double espresso shot poured over cold whole milk, ice and house-crafted caramel syrup',
        price: 2400,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'Anisa Restaurant and Lounge',
    categoryName: 'Lounge Smoothies & Shakes',
    categoryDescription: 'Velvety milkshakes, thick berry smoothies and signature lounge coolers',
    items: [
      {
        name: 'Strawberry Cream Thick Smoothie',
        description: 'Sweet fresh strawberries blended thick with rich cream, vanilla yogurt and ice',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Oreo & Vanilla Cream Shake',
        description: 'Whole Oreo cookies crushed and blended with rich vanilla ice cream and whipped cream',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop'
      },
      {
        name: 'Tropical Sunrise Cooler Mocktail',
        description: 'Layered blend of sweet mango nectar, fresh orange juice, grenadine and soda',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Anisa Classic Chapman with Angostura',
        description: 'Traditional Nigerian Chapman garnished with fresh cucumber and lemon wedges',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'KFC Kabuga (BUK / Kano 2)',
    categoryName: 'KFC Drinks & Krushers',
    categoryDescription: 'Ice cold soft drinks, Krusher smoothies and refreshing sides in Kabuga',
    items: [
      {
        name: 'Strawberry Krushers Frozen Smoothie',
        description: 'Blended sweet strawberry fruit swirl with soft cream and crushed ice crystals',
        price: 2200,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Oreo Cookies & Cream Krusher',
        description: 'Crunchy Oreo biscuit pieces churned with thick soft serve vanilla cream',
        price: 2400,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop'
      },
      {
        name: 'Chilled Pepsi (500ml Bottle)',
        description: 'Ice cold Pepsi bottle served direct from the KFC Kabuga cooler',
        price: 600,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop'
      },
      {
        name: 'Zobo Refresher Cup',
        description: 'Chilled hibiscus drink with gentle fruit and clove infusion',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'Royal Taste Restaurant',
    categoryName: 'Natural Smoothies & Drinks',
    categoryDescription: 'Fresh local fruit smoothies, Kunu Aya and cold zobo in Kofar Kabuga',
    items: [
      {
        name: 'Banana, Mango & Honey Smoothie',
        description: 'Sweet Kano mango and ripe bananas blended with pure amber honey and milk',
        price: 1600,
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop'
      },
      {
        name: 'Cold-Pressed Watermelon & Ginger Drink',
        description: 'Fresh seedless watermelon juice infused with a touch of crushed ginger root',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Royal Chilled Zobo with Clove',
        description: 'Authentic Hausa hibiscus infusion with ginger, cloves and sweet pineapple flavor',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      },
      {
        name: 'Kunu Aya Super Blend',
        description: 'Fresh tiger nut extract with dried dates, coconut flesh and natural spices',
        price: 1000,
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'Dee_Royale Eatery N Restaurant',
    categoryName: 'Special Smoothies & Teas',
    categoryDescription: 'Creamy fruit smoothies, spiced hot tea pots and chilled teas at TAT Plaza',
    items: [
      {
        name: 'Dee_Royale Mango & Yogurt Smoothie',
        description: 'Creamy yogurt blended with ripe mango chunks, honey and ice',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop'
      },
      {
        name: 'Iced Peach Lemonade Slush',
        description: 'Sweet peach puree blended with freshly squeezed lemonade over crushed ice',
        price: 1400,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Special Spiced Hot Tea Pot (Kano Blend)',
        description: 'Traditional Northern spiced black tea infused with ginger, cloves, habba and mint',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop'
      },
      {
        name: 'Chilled Zobo with Pineapple',
        description: 'Refreshing hibiscus juice brewed with fresh ginger and sweet pineapple',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      }
    ]
  },
  {
    restaurantName: 'Katforex Restaurant',
    categoryName: 'Smoothies & Fresh Coolers',
    categoryDescription: 'Thick fruit smoothies and iced teas on Aminu Kano Way, Kofar Gadon Kaya',
    items: [
      {
        name: 'Fresh Strawberry & Banana Smoothie',
        description: 'Blended sweet strawberries, ripe bananas, low-fat yogurt and honey drizzle',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop'
      },
      {
        name: 'Mango Passionfruit Slush Smoothie',
        description: 'Sweet northern mango puree blended with tangy passionfruit and crushed ice',
        price: 1500,
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop'
      },
      {
        name: 'Avocado Green Energy Smoothie',
        description: 'Ripe buttery avocado, sweet banana, whole milk and pure amber honey',
        price: 2000,
        image: 'https://images.unsplash.com/photo-1638176066666-ffb2f5d22223?w=600&auto=format&fit=crop'
      },
      {
        name: 'Iced Lemon & Garden Mint Tea',
        description: 'Freshly brewed black tea sweetened with crushed ice and fresh mint leaves',
        price: 1000,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      },
      {
        name: 'Katforex Chilled Zobo with Ginger',
        description: 'Pure Kano hibiscus juice boiled with clove and spicy ginger',
        price: 800,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop'
      }
    ]
  }
];

export async function seedDrinksAndSmoothies(sequelizeInstance: Sequelize) {
  const Restaurant = sequelizeInstance.models.Restaurant || sequelizeInstance.define('Restaurant', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, { tableName: 'restaurants', timestamps: false });

  const Category = sequelizeInstance.models.Category || sequelizeInstance.define('Category', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'restaurant_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.TEXT, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' }
  }, { tableName: 'categories', timestamps: true, underscored: true });

  const FoodItem = sequelizeInstance.models.FoodItem || sequelizeInstance.define('FoodItem', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    restaurantId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'restaurant_id' },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'category_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    image: { type: DataTypes.TEXT, allowNull: true },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_available' },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_featured' },
    preparationTimeMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10, field: 'preparation_time_min' }
  }, { tableName: 'food_items', timestamps: true, underscored: true });

  let totalCategoriesAdded = 0;
  let totalItemsAdded = 0;

  for (const group of DRINKS_AND_SMOOTHIES_SEED) {
    // Find restaurant by prefix or exact match
    const rest = (await Restaurant.findOne({
      where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), 'LIKE', `%${group.restaurantName.slice(0, 10).toLowerCase()}%`)
    })) as any;

    if (!rest) {
      console.warn(`Restaurant not found: ${group.restaurantName}`);
      continue;
    }

    // Find or create category
    let [category, createdCat] = await Category.findOrCreate({
      where: {
        restaurantId: rest.id,
        name: group.categoryName
      },
      defaults: {
        restaurantId: rest.id,
        name: group.categoryName,
        description: group.categoryDescription,
        image: group.items[0]?.image || null,
        sortOrder: 10,
        isActive: true
      }
    });

    const catModel = category as any;

    if (createdCat) totalCategoriesAdded++;

    for (const item of group.items) {
      // Find or create food item
      const [food, createdFood] = await FoodItem.findOrCreate({
        where: {
          restaurantId: rest.id,
          name: item.name
        },
        defaults: {
          restaurantId: rest.id,
          categoryId: catModel.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          isAvailable: true,
          isFeatured: false,
          preparationTimeMin: 10
        }
      });

      if (createdFood) {
        totalItemsAdded++;
      } else {
        // Update image and description if exists
        await food.update({
          categoryId: catModel.id,
          description: item.description,
          price: item.price,
          image: item.image,
          isAvailable: true
        });
      }
    }
  }

  console.log(`Successfully seeded drinks & smoothies: ${totalCategoriesAdded} new categories, ${totalItemsAdded} new food items processed.`);
}
