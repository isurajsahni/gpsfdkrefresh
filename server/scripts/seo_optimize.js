require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function optimizeProducts() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to optimize...`);

    const promptInstructions = `
You are an expert SEO specialist for an e-commerce website. 
Your task is to SEO-optimize the given product details for maximum search engine visibility and conversions using the target keywords: "premium wall canvas", "luxury wall canvas", "wall art".

Instructions:
1. Rewrite product title to be SEO-optimized, clear, and keyword-rich while maintaining readability.
2. Create compelling meta titles (50-60 characters) including primary keywords.
3. Generate engaging meta descriptions (140-160 characters) that improve click-through rates and include relevant keywords naturally.
4. Optimize product descriptions by naturally incorporating target keywords, adding semantic keywords and variations, improving readability (short paragraphs, bullet points), highlighting premium/luxury aspects, materials, and use cases. Use proper HTML heading structure (<h1>, <h2>, <h3>) where applicable. Also, naturally add at least 1 internal HTML like `<a href="/${currentData.categoryName.toLowerCase().replace(/ /g, '-')}">Browse more ${currentData.categoryName}</a>` to improve internal linking. Return an HTML string for the description.
5. Create a descriptive, keyword-rich alt text string that we will use for the images (around 10-15 words).

Please return ONLY a valid JSON object matching this structure without Markdown formatting:
{
  "name": "SEO Optimized Product Title",
  "metaTitle": "Optimized Meta Title",
  "metaDescription": "Optimized Meta Description",
  "description": "<html>Optimized HTML Description with H2/H3 tags and bullet points</html>",
  "imageAlt": "SEO optimized alt text for images"
}
`;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`[${i+1}/${products.length}] Optimizing: ${product.name}`);

        const currentData = {
          name: product.name,
          description: product.description || '',
          categoryName: product.category?.name || "Wall Art"
        };

        const result = await model.generateContent(promptInstructions + "\n\nCurrent Product Info:\n" + JSON.stringify(currentData));
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const optimized = JSON.parse(responseText);
            
            product.name = optimized.name || product.name;
            product.metaTitle = optimized.metaTitle;
            product.metaDescription = optimized.metaDescription;
            product.description = optimized.description;
            
            // Map the same alt text for all images, appending numbers if there are multiple to avoid exact duplicates
            if (product.images && product.images.length > 0) {
                product.images = product.images.map((img, idx) => ({
                    ...img,
                    alt: \`\${optimized.imageAlt} - view \${idx + 1}\`
                }));
            }

            await product.save();
            console.log(`✅ Passed. Saved optimized: ${product.name}`);
            
            // Small delay to prevent API rate limiting
            await new Promise(res => setTimeout(res, 2000));
        } catch (err) {
            console.error(`❌ Failed to parse JSON or save for product: ${product.name}`, err.message);
        }
    }

    console.log("All products optimized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Optimization failed:", error);
    process.exit(1);
  }
}

optimizeProducts();
