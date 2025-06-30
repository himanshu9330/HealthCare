const dotenv = require('dotenv');
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModelInfos();
    models.forEach(model => {
      console.log(`🧠 Model: ${model.name}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods}`);
      console.log('---');
    });
  } catch (error) {
    console.error("❌ Failed to list models:", error.message || error);
  }
}

listModels();
