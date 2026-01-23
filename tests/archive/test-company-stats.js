// Test script to verify company stats functionality
import { companyService } from './src/services/companyService.js';

async function testCompanyStats() {
  try {
    console.log('Testing company stats...');
    
    // Test getting company statistics
    const stats = await companyService.getCompaniesStats();
    console.log('Company Statistics:', stats);
    
    // Test getting all companies
    const companies = await companyService.getAllCompanies();
    console.log(`Total companies in database: ${companies.length}`);
    
    // Verify stats match actual data
    const actualStats = {
      total: companies.length,
      active: companies.filter(c => c.accountStatus === 'active').length,
      pending: companies.filter(c => c.accountStatus === 'pending').length,
      approved: companies.filter(c => c.accountStatus === 'approved').length,
      rejected: companies.filter(c => c.accountStatus === 'rejected').length,
      inactive: companies.filter(c => c.accountStatus === 'inactive').length,
      blacklisted: companies.filter(c => c.accountStatus === 'blacklisted').length,
    };
    
    console.log('Actual stats from data:', actualStats);
    console.log('Stats match:', JSON.stringify(stats) === JSON.stringify(actualStats));
    
  } catch (error) {
    console.error('Error testing company stats:', error);
  }
}

testCompanyStats();