#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== APS Environment Variables Setup ===\n');
console.log('This script will help you set up your Autodesk Platform Services credentials.');
console.log('You can get these credentials from: https://aps.autodesk.com/myapps\n');

let credentials = {};

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    // Get APS Client ID
    credentials.APS_CLIENT_ID = await askQuestion('Enter your APS Client ID: ');
    if (!credentials.APS_CLIENT_ID) {
      console.log('❌ Client ID is required!');
      process.exit(1);
    }

    // Get APS Client Secret
    credentials.APS_CLIENT_SECRET = await askQuestion('Enter your APS Client Secret: ');
    if (!credentials.APS_CLIENT_SECRET) {
      console.log('❌ Client Secret is required!');
      process.exit(1);
    }

    // Set default callback URL
    const defaultCallback = 'http://localhost:3000/api/aps/callback/oauth';
    const callbackInput = await askQuestion(`Enter your APS Callback URL (default: ${defaultCallback}): `);
    credentials.APS_CALLBACK_URL = callbackInput || defaultCallback;

    console.log('\n=== Summary ===');
    console.log(`Client ID: ${credentials.APS_CLIENT_ID}`);
    console.log(`Client Secret: ${'*'.repeat(credentials.APS_CLIENT_SECRET.length)}`);
    console.log(`Callback URL: ${credentials.APS_CALLBACK_URL}`);

    const confirm = await askQuestion('\nDo you want to proceed? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled.');
      process.exit(0);
    }

    // Create .env file
    const envContent = `# Autodesk Platform Services Configuration
APS_CLIENT_ID=${credentials.APS_CLIENT_ID}
APS_CLIENT_SECRET=${credentials.APS_CLIENT_SECRET}
APS_CALLBACK_URL=${credentials.APS_CALLBACK_URL}
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!');

    // Update launch.json for VS Code debugging
    const launchJsonPath = '.vscode/launch.json';
    if (fs.existsSync(launchJsonPath)) {
      try {
        const launchJson = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8'));
        if (launchJson.configurations && launchJson.configurations[0] && launchJson.configurations[0].env) {
          launchJson.configurations[0].env.APS_CLIENT_ID = credentials.APS_CLIENT_ID;
          launchJson.configurations[0].env.APS_CLIENT_SECRET = credentials.APS_CLIENT_SECRET;
          launchJson.configurations[0].env.APS_CALLBACK_URL = credentials.APS_CALLBACK_URL;
          
          fs.writeFileSync(launchJsonPath, JSON.stringify(launchJson, null, 2));
          console.log('✅ VS Code launch.json updated successfully!');
        }
      } catch (error) {
        console.log('⚠️  Could not update launch.json:', error.message);
      }
    }

    console.log('\n=== Next Steps ===');
    console.log('1. Run: npm start');
    console.log('2. Open your browser to: http://localhost:3000');
    console.log('3. Sign in with your Autodesk account');
    console.log('\nNote: Make sure your BIM 360 or ACC account is provisioned for this app.');
    console.log('Learn more: https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();