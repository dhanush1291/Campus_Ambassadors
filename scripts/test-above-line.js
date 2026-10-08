
const sharp = require('sharp');

async function testAboveLine() {
  const collegeName = 'IIT Tirupati';
  const tWidth = 3375;
  const tHeight = 4219;
  const centerX = tWidth / 2;

  const svgTest = `<svg width="${tWidth}" height="${tHeight}" viewBox="0 0 ${tWidth} ${tHeight}" xmlns="http://www.w3.org/2000/svg">
    <text 
      x="${centerX}" 
      y="2820" 
      text-anchor="middle" 
      font-family="'Montserrat', 'Poppins', 'Helvetica Neue', Arial, sans-serif" 
      font-size="100" 
      font-weight="800" 
      letter-spacing="2" 
      fill="#2d1767"
    >${collegeName}</text>
  </svg>`;

  const compositedBuffer = await sharp('CAMPUS AMBASSADOR.png')
    .composite([{ input: Buffer.from(svgTest), top: 0, left: 0 }])
    .png()
    .toBuffer();

  await sharp(compositedBuffer)
    .extract({ left: 400, top: 2500, width: 2575, height: 480 })
    .png()
    .toFile('output/test-above-line.png');

  console.log('Saved output/test-above-line.png');
}

testAboveLine().catch(console.error);
