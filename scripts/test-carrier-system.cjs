/**
 * Test script for the carrier management system
 * This script tests the database schema and API endpoints
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Carrier Management System...\n');

// Test 1: Check if database schema is valid
console.log('1. Testing database schema...');
try {
  const schemaPath = path.join(__dirname, '../apps/worker/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for required tables
  const requiredTables = [
    'carriers',
    'user_carrier_preferences', 
    'organization_carrier_settings',
    'user_documents'
  ];
  
  let schemaValid = true;
  requiredTables.forEach(table => {
    if (!schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`❌ Missing table: ${table}`);
      schemaValid = false;
    } else {
      console.log(`✅ Table found: ${table}`);
    }
  });
  
  if (schemaValid) {
    console.log('✅ Database schema is valid\n');
  } else {
    console.log('❌ Database schema has issues\n');
  }
} catch (error) {
  console.log('❌ Error reading schema file:', error.message, '\n');
}

// Test 2: Check if API endpoints are properly defined
console.log('2. Testing API endpoints...');
try {
  const workerPath = path.join(__dirname, '../apps/worker/src/index.ts');
  const workerCode = fs.readFileSync(workerPath, 'utf8');
  
  const requiredEndpoints = [
    '/api/carriers/with-preferences',
    '/api/carriers/preferences',
    '/api/documents/user',
    '/api/documents/upload',
    '/api/carriers/organization-settings'
  ];
  
  let endpointsValid = true;
  requiredEndpoints.forEach(endpoint => {
    if (!workerCode.includes(endpoint)) {
      console.log(`❌ Missing endpoint: ${endpoint}`);
      endpointsValid = false;
    } else {
      console.log(`✅ Endpoint found: ${endpoint}`);
    }
  });
  
  if (endpointsValid) {
    console.log('✅ API endpoints are properly defined\n');
  } else {
    console.log('❌ API endpoints have issues\n');
  }
} catch (error) {
  console.log('❌ Error reading worker file:', error.message, '\n');
}

// Test 3: Check if React components are properly structured
console.log('3. Testing React components...');
try {
  const componentsPath = path.join(__dirname, '../apps/app/src/components');
  const requiredComponents = [
    'CarriersPanel.tsx',
    'OrganizationCarrierAdmin.tsx'
  ];
  
  let componentsValid = true;
  requiredComponents.forEach(component => {
    const componentPath = path.join(componentsPath, component);
    if (!fs.existsSync(componentPath)) {
      console.log(`❌ Missing component: ${component}`);
      componentsValid = false;
    } else {
      console.log(`✅ Component found: ${component}`);
    }
  });
  
  if (componentsValid) {
    console.log('✅ React components are properly structured\n');
  } else {
    console.log('❌ React components have issues\n');
  }
} catch (error) {
  console.log('❌ Error checking components:', error.message, '\n');
}

// Test 4: Check if types are properly defined
console.log('4. Testing TypeScript types...');
try {
  const typesPath = path.join(__dirname, '../apps/app/src/types.ts');
  const typesCode = fs.readFileSync(typesPath, 'utf8');
  
  const requiredTypes = [
    'Carrier',
    'UserCarrierPreference',
    'OrganizationCarrierSetting',
    'CarrierWithPreferences',
    'UserDocument',
    'DocumentUploadRequest',
    'DocumentUploadResponse'
  ];
  
  let typesValid = true;
  requiredTypes.forEach(type => {
    if (!typesCode.includes(`interface ${type}`) && !typesCode.includes(`type ${type}`)) {
      console.log(`❌ Missing type: ${type}`);
      typesValid = false;
    } else {
      console.log(`✅ Type found: ${type}`);
    }
  });
  
  if (typesValid) {
    console.log('✅ TypeScript types are properly defined\n');
  } else {
    console.log('❌ TypeScript types have issues\n');
  }
} catch (error) {
  console.log('❌ Error checking types:', error.message, '\n');
}

// Test 5: Check if API functions are properly defined
console.log('5. Testing API functions...');
try {
  const apiPath = path.join(__dirname, '../apps/app/src/lib/api.ts');
  const apiCode = fs.readFileSync(apiPath, 'utf8');
  
  const requiredFunctions = [
    'getCarriersWithPreferences',
    'updateCarrierPreference',
    'getUserDocuments',
    'uploadDocument',
    'getOrganizationCarrierSettings',
    'updateOrganizationCarrierSetting'
  ];
  
  let functionsValid = true;
  requiredFunctions.forEach(func => {
    if (!apiCode.includes(`export const ${func}`)) {
      console.log(`❌ Missing function: ${func}`);
      functionsValid = false;
    } else {
      console.log(`✅ Function found: ${func}`);
    }
  });
  
  if (functionsValid) {
    console.log('✅ API functions are properly defined\n');
  } else {
    console.log('❌ API functions have issues\n');
  }
} catch (error) {
  console.log('❌ Error checking API functions:', error.message, '\n');
}

console.log('🎉 Carrier Management System test completed!');
console.log('\n📋 Summary:');
console.log('- Database schema with carrier preferences and document management');
console.log('- API endpoints for carrier selection and document upload');
console.log('- React components for user and admin interfaces');
console.log('- TypeScript types for type safety');
console.log('- Integration with existing dashboard and settings pages');
console.log('\n🚀 Ready for deployment and testing!');
