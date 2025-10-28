-- StockSavvy Database Schema for PostgreSQL

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('home', 'business')),
  google_id VARCHAR(255) UNIQUE,
  subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'expired')),
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  parent_category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Items Table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50),
  expiry_date DATE,
  low_stock_level DECIMAL(10,2),
  location_id INT,
  barcode VARCHAR(255),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Vendors Table (for business users)
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shopping/Order Lists Table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  vendor_id INT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expiry', 'low_stock')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('pro', 'business')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create a default system user for default categories
INSERT INTO users (email, password, name, user_type) 
VALUES ('system@stocksavvy.com', 'system', 'System', 'home')
ON CONFLICT (email) DO NOTHING;

-- Insert Default Categories
INSERT INTO categories (user_id, name, is_default, parent_category) 
SELECT 1, name, is_default, parent_category FROM (VALUES
  ('अनाज और आटा', TRUE, 'किराना'),
  ('दालें', TRUE, 'किराना'),
  ('मसाले', TRUE, 'किराना'),
  ('तेल और घी', TRUE, 'किराना'),
  ('नमक और चीनी', TRUE, 'किराना'),
  ('स्नैक्स और बिस्किट', TRUE, 'किराना'),
  ('चाय और कॉफ़ी', TRUE, 'किराना'),
  ('जूस और ड्रिंक्स', TRUE, 'किराना'),
  ('दूध', TRUE, 'डेयरी और फ्रिज'),
  ('दही और पनीर', TRUE, 'डेयरी और फ्रिज'),
  ('मक्खन', TRUE, 'डेयरी और फ्रिज'),
  ('अंडे', TRUE, 'डेयरी और फ्रिज'),
  ('सब्जियाँ', TRUE, 'डेयरी और फ्रिज'),
  ('फल', TRUE, 'डेयरी और फ्रिज'),
  ('नूडल्स और पास्ता', TRUE, 'पैकेज्ड फ़ूड'),
  ('सॉस और केचप', TRUE, 'पैकेज्ड फ़ूड'),
  ('जैम और स्प्रेड', TRUE, 'पैकेज्ड फ़ूड'),
  ('ब्रेकफास्ट सीरियल', TRUE, 'पैकेज्ड फ़ूड'),
  ('टॉयलेटरीज़', TRUE, 'घर और सफाई'),
  ('सफाई का सामान', TRUE, 'घर और सफाई'),
  ('कागज़ का सामान', TRUE, 'घर और सफाई'),
  ('दवाइयाँ', TRUE, 'स्वास्थ्य और मेडिकल'),
  ('विटामिन और सप्लीमेंट्स', TRUE, 'स्वास्थ्य और मेडिकल'),
  ('फर्स्ट ऐड', TRUE, 'स्वास्थ्य और मेडिकल'),
  ('डायपर', TRUE, 'बेबी केयर'),
  ('बेबी फ़ूड', TRUE, 'बेबी केयर'),
  ('स्टेशनरी', TRUE, 'अन्य'),
  ('इलेक्ट्रॉनिक्स', TRUE, 'अन्य'),
  ('अन्य', TRUE, 'अन्य')
) AS t(name, is_default, parent_category)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = t.name AND user_id = 1);
