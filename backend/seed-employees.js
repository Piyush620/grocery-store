#!/usr/bin/env node

/**
 * Employee Seed Script for Shop POS System
 * Creates sample employees for testing
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

const SAMPLE_EMPLOYEES = [
  {
    name: 'Raj Kumar',
    position: 'Manager',
    phone: '9876543210',
    email: 'raj@shop.com',
    salary: 25000,
    hire_date: '2023-01-15'
  },
  {
    name: 'Priya Singh',
    position: 'Cashier',
    phone: '9876543211',
    email: 'priya@shop.com',
    salary: 15000,
    hire_date: '2023-06-20'
  },
  {
    name: 'Arjun Patel',
    position: 'Sales Associate',
    phone: '9876543212',
    email: 'arjun@shop.com',
    salary: 12000,
    hire_date: '2023-08-10'
  },
  {
    name: 'Neha Sharma',
    position: 'Sales Associate',
    phone: '9876543213',
    email: 'neha@shop.com',
    salary: 12000,
    hire_date: '2024-01-05'
  },
  {
    name: 'Amit Kumar',
    position: 'Stock Manager',
    phone: '9876543214',
    email: 'amit@shop.com',
    salary: 18000,
    hire_date: '2023-03-12'
  }
];

async function seedEmployees() {
  console.log('🌱 Seeding sample employees...\n');

  for (const employee of SAMPLE_EMPLOYEES) {
    try {
      const response = await axios.post(`${API_URL}/employees`, employee);
      console.log(`✓ Added: ${employee.name} (${employee.position})`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
        console.log(`ℹ Already exists: ${employee.name}`);
      } else {
        console.error(`✗ Error adding ${employee.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  console.log('\n✓ Seeding complete!');
  console.log('\nSample employees created:');
  SAMPLE_EMPLOYEES.forEach(e => {
    console.log(`  ${e.name} - ${e.position}`);
  });
}

seedEmployees().catch(console.error);
