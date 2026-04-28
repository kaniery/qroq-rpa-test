const express = require('express');
const app = express();
// ポートを 8080 に変更
app.listen(8080, () => console.log('Listening on 8080'));
app.get('/', (req, res) => res.send('8080 is OK'));