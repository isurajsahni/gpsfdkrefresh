const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'products.json');
const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Original count of products:', products.length);

const namesToRemove = new Set([
  'The Wolf of Wall Street',
  'The Social Outcast',
  'Noir Petal Sweep',
  'Azure Gaze',
  'Dreaming in Colors',
  'Volcanic Core',
  'Obsidian Ember',
  'The Noir Executive',
  'The Concrete Jungle',
  'Neon Nostalgia',
  'The Gilded Bloom',
  'Celestial Frontier'
]);

const filteredProducts = products.filter(p => !namesToRemove.has(p.name));

console.log('New count of products:', filteredProducts.length);

fs.writeFileSync(filePath, JSON.stringify(filteredProducts, null, 2), 'utf8');
console.log('Filtered products.json saved successfully!');
