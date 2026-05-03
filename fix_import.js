const fs = require('fs');
let content = fs.readFileSync('src/components/Developers.jsx', 'utf8');
content = content.replace('import React, { useState, useEffect } from \'react\';', 'import { useState, useEffect } from \'react\';');
fs.writeFileSync('src/components/Developers.jsx', content, 'utf8');
console.log('Fixed import statement');
