const { analyzeDocumentContent, extractKeywords } = require('./src/lib/huggingface.ts');

// Simple test
const question = "グレードについて教えてください";
const sampleContent = `
スピードリンクジャパンの評価制度
グレード制度について
グレードの概要
報酬について（給与の内訳・グレード手当・昇給の流れ）
各種詳細
グレードの役割と昇格条件
STEP１（Rookie・Associate）
STEP２（Sub Leader～Sub Manager）
STEP３（Manager～）
`;

console.log('Testing keyword extraction...');
// Test keyword extraction function separately
function extractKeywords(question) {
  const stopWords = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'から', 'まで', 'について', 'という', 'です', 'ます', 'である', 'どのような', 'どんな', 'なに', 'なぜ', 'いつ', 'どこ', 'だれ', 'どうやって'];
  
  const words = question
    .replace(/[？！。、,，]/g, ' ')
    .split(/[\s\u3000]+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .map(word => word.replace(/[？！。、]/g, ''))
    .filter(word => word.length > 0);
  
  return Array.from(new Set(words)).slice(0, 5);
}

const keywords = extractKeywords(question);
console.log('Extracted keywords:', keywords);

// Test matching
console.log('\nTesting keyword matching...');
const contentLines = sampleContent.split('\n').filter(line => line.trim().length > 0);

keywords.forEach(keyword => {
  const matches = contentLines.filter(line => 
    line.toLowerCase().includes(keyword.toLowerCase())
  );
  console.log(`Keyword "${keyword}" found ${matches.length} matches:`);
  matches.forEach(match => console.log(`  - ${match.trim()}`));
});
