import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to Angular pages
const angularPagesDir = path.join(__dirname, 'src', 'pages', 'angular');

// Get all MDX files in the directory
const mdxFiles = fs.readdirSync(angularPagesDir)
  .filter(file => file.endsWith('.mdx'));

// Update each file
mdxFiles.forEach(file => {
  const filePath = path.join(angularPagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the layout
  content = content.replace(
    /layout: \.\.\/\.\.\/layouts\/Layout\.astro/g,
    'layout: ../../layouts/QuizLayout.astro'
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`Updated layout in ${file}`);
});

console.log('All Angular pages have been updated to use QuizLayout.');
