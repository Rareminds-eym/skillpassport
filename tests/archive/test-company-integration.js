// Simple test to verify company service integration
import { companyService } from './src/services/companyService.js';

async function testCompanyService() {
  try {
    console.log('Testing company service...');
    
    // Test fetching companies
    const companies = await companyService.getAllCompanies();
    console.log(`✅ Successfully fetched ${companies.length} companies`);
    
    if (companies.length > 0) {
      console.log('Sample company:', {
        id: companies[0].id,
        name: companies[0].name,
        code: companies[0].code,
        industry: companies[0].industry,
        accountStatus: companies[0].accountStatus
      });
    }
    
    // Test filtered search
    const filteredCompanies = await companyService.getFilteredCompanies({
      searchTerm: 'test'
    });
    console.log(`✅ Filtered search returned ${filteredCompanies.length} companies`);
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompanyService();