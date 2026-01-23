// Test script to verify company update functionality
import { companyService } from './src/services/companyService.js';

async function testCompanyUpdate() {
  try {
    console.log('Testing company update functionality...');
    
    // First, get all companies to find one to update
    const companies = await companyService.getAllCompanies();
    console.log(`Found ${companies.length} companies`);
    
    if (companies.length === 0) {
      console.log('No companies found to test update');
      return;
    }
    
    const testCompany = companies[0];
    console.log('Testing update on company:', testCompany.name);
    
    // Test update with minimal data
    const updateData = {
      name: testCompany.name,
      code: testCompany.code,
      industry: 'Technology', // Update industry
      companyDescription: 'Updated description for testing',
      specialRequirements: 'Updated special requirements'
    };
    
    console.log('Updating company with data:', updateData);
    
    const updatedCompany = await companyService.updateCompany(testCompany.id, updateData);
    console.log('Update successful!');
    console.log('Updated company:', updatedCompany);
    
    // Verify the update
    const verifyCompany = await companyService.getCompanyById(testCompany.id);
    console.log('Verification - Company after update:', verifyCompany);
    
    if (verifyCompany.industry === 'Technology') {
      console.log('✅ Industry update verified');
    } else {
      console.log('❌ Industry update failed');
    }
    
    if (verifyCompany.metadata?.companyDescription === 'Updated description for testing') {
      console.log('✅ Company description update verified');
    } else {
      console.log('❌ Company description update failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing company update:', error);
    console.error('Error details:', error.message);
  }
}

testCompanyUpdate();