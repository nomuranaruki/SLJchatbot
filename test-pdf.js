const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractPdfText(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Test with the uploaded file
const filePath = path.join(__dirname, 'uploads', '6805702c-f3c0-4af4-82b7-21cc427dd125.pdf');
extractPdfText(filePath)
  .then(text => {
    console.log('Success! Text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));
  })
  .catch(error => {
    console.error('Failed:', error.message);
  });
