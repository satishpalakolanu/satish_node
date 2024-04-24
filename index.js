const http = require('http');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const PORT = 3110;
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer(async (req, res) => {
    console.log(req.url);

    try {
        if (req.url === '/') {
            serveStaticFile(res, 'index.html', 'text/html');
        } else if (req.url.startsWith('/assets/')) {
            serveAsset(req, res);
        } else if (req.url === '/style.css') {
            serveStaticFile(res, 'style.css', 'text/css');
        } else if (req.url === '/about.html') {
            serveStaticFile(res, 'about.html', 'text/html');
        } else if (req.url === '/api') {
            await serveApiData(res);
        } else {
            serveNotFound(res);
        }
    } catch (error) {
        console.error(error);
        serveError(res);
    }
});

async function serveStaticFile(res, fileName, contentType) {
    const filePath = path.join(PUBLIC_DIR, fileName);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1>');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

function serveAsset(req, res) {
    const filePath = path.join(PUBLIC_DIR, req.url);

    const contentType = getContentType(filePath);
    if (!contentType) {
        serveNotFound(res);
        return;
    }

    const imageStream = fs.createReadStream(filePath);
    imageStream.on('error', () => serveNotFound(res));

    res.writeHead(200, { 'Content-Type': contentType });
    imageStream.pipe(res);
}

function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case '.jpg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        default:
            return null;
    }
}

async function serveApiData(res) {
    const uri = "mongodb+srv://palakolanu:satish@cluster0.g78gidm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas cluster');

        const televisionCollection = client.db('television').collection('televisioncollection');
        const collectionData = await televisionCollection.find().toArray();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ TelevisionDetails: collectionData }));
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB Atlas cluster');
    }
}

function serveNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
}

function serveError(res) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 Internal Server Error</h1>');
}

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
