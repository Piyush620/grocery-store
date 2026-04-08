#!/usr/bin/env node

/**
 * Test Data Seeder for Shop POS System
 * Creates sample products for testing the POS system
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

const SAMPLE_PRODUCTS = [
  {
    name: 'Salwar Suit - Blue',
    category: 'Female Suits',
    size: 'M',
    price: 1500,
    quantity: 20,
    barcode: 'SW001'
  },
  {
    name: 'Salwar Suit - Purple',
    category: 'Female Suits',
    size: 'L',
    price: 1800,
    quantity: 15,
    barcode: 'SW002'
  },
  {
    name: 'Salwar Suit - Red',
    category: 'Female Suits',
    size: 'S',
    price: 1500,
    quantity: 18,
    barcode: 'SW003'
  },
  {
    name: 'Kids Dress - Pink',
    category: 'Kids Dresses',
    size: '2-3Y',
    price: 600,
    quantity: 30,
    barcode: 'KD001'
  },
  {
    name: 'Kids Dress - Blue',
    category: 'Kids Dresses',
    size: '3-4Y',
    price: 700,
    quantity: 25,
    barcode: 'KD002'
  },
  {
    name: 'Salwar Suit - Green',
    category: 'Female Suits',
    size: 'XL',
    price: 2000,
    quantity: 12,
    barcode: 'SW004'
  },
  {
    name: 'Kids Dress - Yellow',
    category: 'Kids Dresses',
    size: '4-5Y',
    price: 750,
    quantity: 20,
    barcode: 'KD003'
  }
];

async function seedProducts() {
  console.log('🌱 Seeding sample products...\n');

  for (const product of SAMPLE_PRODUCTS) {
    try {
      const response = await axios.post(`${API_URL}/add-product`, product);
      console.log(`✓ Added: ${product.name} (${product.barcode})`);
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.error?.includes('UNIQUE')) {
        console.log(`ℹ Already exists: ${product.name}`);
      } else {
        console.error(`✗ Error adding ${product.name}:`, error.message);
      }
    }
  }

  console.log('\n✓ Seeding complete!');
  console.log('\nSample barcodes for testing:');
  SAMPLE_PRODUCTS.forEach(p => {
    console.log(`  ${p.barcode} - ${p.name}`);
  });
}

seedProducts().catch(console.error);
