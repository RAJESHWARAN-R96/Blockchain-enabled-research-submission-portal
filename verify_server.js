const http = require('http');

http.get('http://localhost:5000', (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (data.includes('<title>')) {
            console.log('Index page content received!');
        } else {
            console.log('Response received but title tag not found.');
        }
    });
}).on('error', (err) => {
    console.error('Error connecting to server:', err.message);
});
