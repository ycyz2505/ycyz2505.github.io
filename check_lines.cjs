const fs = require('fs');
const ROOT = 'C:/Users/noilinux/Desktop/ycyz2505.github.io/ycyz2505.github.io/';
const files = ['index.html', 'css/style.css', 'readme.md', 'js/features/modal_seating.js', 'js/features/store.js'];
for (const f of files) {
  const buf = fs.readFileSync(ROOT + f);
  const text = buf.toString('utf8');
  const lf = (text.match(/(?<!\r)\n/g) || []).length;
  const crlf = (text.match(/\r\n/g) || []).length;
  const bom = buf[0] === 0xEF ? 'BOM!' : 'no-bom';
  console.log(f.padEnd(34), 'lines=' + (text.split('\r\n').length), 'CRLF=' + crlf, 'bareLF=' + lf, bom);
}
