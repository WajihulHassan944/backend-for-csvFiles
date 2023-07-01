const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const mongodb = require('mongodb');

const bodyParser = require('body-parser');
const app = express();


const cors = require("cors");
app.use(cors());
app.use(express.json());


const url = process.env.url ;
const port = process.env.port || 3000;
const upload = multer({ dest: 'uploads/' });
const MongoClient = mongodb.MongoClient;
const dbName = 'test';
const collectionName = 'helpers';

// Serve the HTML file
app.get('/', (req, res) => {
  res.send("Bismillah 786");
});

// Handle CSV file upload and MongoDB insertion
app.post('/upload', upload.single('csvFile'), (req, res) => {
    const filePath = req.file.path;
    const data = [];
  
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        MongoClient.connect(url, (err, client) => {
          if (err) {
            console.error('Error connecting to MongoDB:', err);
            res.status(500).send('Internal Server Error');
            return;
          }
  
          const db = client.db(dbName);
          const collection = db.collection(collectionName);
  
          collection.insertMany(data, (err, result) => {
            if (err) {
              console.error('Error inserting data into MongoDB:', err);
              res.status(500).send('Internal Server Error');
              return;
            }
  
            fs.unlinkSync(filePath); // Remove the temporary CSV file
            res.send('CSV file uploaded and data inserted into MongoDB.');
  
            // Add an alert message
            const script = `
              <script>
                alert('CSV file uploaded and data inserted into MongoDB.');
              </script>
            `;
            res.write(script);
            res.end();
          });
  
          client.close();
        });
      });
  });
  
// API endpoint to fetch the data from your backend API
app.get('/data', (req, res) => {
  const apiURL = 'https://backend-for-plans.onrender.com/api/helpers';

  axios.get(apiURL)
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${port} `);
});
