const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = [
  'users.js',
  'services.js', 
  'recommendations.js',
  'payments.js',
  'healthPrograms.js',
  'assistant.js',
  'admin.js'
];

const fusekiAuthImport = `const { FUSEKI_URL, fusekiAuth } = require('../config/fuseki');\n`;

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has the import
  if (content.includes("require('../config/fuseki')")) {
    console.log(`✓ ${file} already updated`);
    return;
  }
  
  // Remove old FUSEKI_URL declaration
  content = content.replace(/const FUSEKI_URL = process\.env\.FUSEKI_URL[^;]*;?\n?/g, '');
  
  // Add import after other requires
  const requireRegex = /(const .+ = require\(.+\);?\n)+/;
  const match = content.match(requireRegex);
  
  if (match) {
    const lastRequire = match[0];
    content = content.replace(lastRequire, lastRequire + fusekiAuthImport);
  } else {
    // Add at the beginning
    content = fusekiAuthImport + content;
  }
  
  // Add ...fusekiAuth to axios.get calls
  content = content.replace(
    /axios\.get\(`\$\{FUSEKI_URL\}\/query`,\s*\{([^}]+)\}\)/g,
    (match, params) => {
      if (match.includes('...fusekiAuth')) return match;
      return `axios.get(\`\${FUSEKI_URL}/query\`, {${params},\n      ...fusekiAuth\n    })`;
    }
  );
  
  // Add ...fusekiAuth to axios.post calls
  content = content.replace(
    /axios\.post\(`\$\{FUSEKI_URL\}\/data`,([^,]+),\s*\{([^}]+)\}\)/g,
    (match, data, params) => {
      if (match.includes('...fusekiAuth')) return match;
      return `axios.post(\`\${FUSEKI_URL}/data\`,${data}, {${params},\n      ...fusekiAuth\n    })`;
    }
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated ${file}`);
});

console.log('\n✨ All files updated!');
