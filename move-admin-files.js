import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const layoutFiles = [
  'DashboardLayout.tsx',
  'Sidebar.tsx',
  'Topbar.tsx'
];

const sourceLayoutDir = path.join(__dirname, 'src', 'components', 'layout');
const targetLayoutDir = path.join(__dirname, 'src', 'components', 'layout', 'admin');

if (!fs.existsSync(targetLayoutDir)) {
  fs.mkdirSync(targetLayoutDir, { recursive: true });
}

layoutFiles.forEach(file => {
  const sourceFile = path.join(sourceLayoutDir, file);
  const targetFile = path.join(targetLayoutDir, file);
  
  if (fs.existsSync(sourceFile)) {
    fs.renameSync(sourceFile, targetFile);
    console.log(`✅ Moved ${file} to src/components/layout/admin/`);
  }
});

console.log('\nAdmin layout folder restructure complete!');
