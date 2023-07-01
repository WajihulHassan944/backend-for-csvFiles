const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const csvParser = require('csv-parser');

// Connect to MongoDB
mongoose.connect('mongodb+srv://<your-mongodb-connection-string>', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a file schema
const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a file model
const File = mongoose.model('File', fileSchema);

// Set up file upload using multer
const upload = multer({ dest: 'uploads/' });

// Serve static files (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploaded_files', express.static(path.join(__dirname, 'uploads')));

// API endpoint to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create a new file record in the database
  try {
    const file = new File({
      fileName: req.file.originalname,
      filePath: req.file.filename,
    });
    await file.save();
    console.log('Uploaded file:', req.file.originalname);
    return res.status(200).send('File uploaded successfully.');
  } catch (error) {
    console.error('Error saving file:', error);
    return res.status(500).send('Error saving file.');
  }
});

// API endpoint to get a list of uploaded files
app.get('/files', async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: 'desc' });
    return res.json(files);
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return res.status(500).send('Error retrieving file list.');
  }
});

// API endpoint to handle file deletion
app.get('/delete/:file', async (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(__dirname, 'uploads', fileName);

  try {
    // Delete the file record from the database
    await File.deleteOne({ fileName: fileName });

    // Delete the file from the filesystem
    fs.unlink(filePath, err => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send('Error deleting file.');
      }
      console.log('Deleted file:', fileName);
      return res.status(200).send('File deleted successfully.');
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).send('Error deleting file.');
  }
});

// API endpoint to view file
app.get('/view/:file', async (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(__dirname, 'uploads', fileName);

  try {
    const results = [];
    const header = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headers) => {
        // Store the CSV headers
        header.push(...headers);
      })
      .on('data', (data) => {
        // Store each row of CSV data
        results.push(data);
      })
      .on('end', () => {
        // Generate HTML table from the CSV data
        const tableHTML =
          '<thead><tr>' +
          header.map((cell) => `<th>${cell}</th>`).join('') +
          '</tr></thead><tbody>' +
          results
            .map((row) => '<tr>' + header.map((cell) => `<td>${row[cell]}</td>`).join('') + '</tr>')
            .join('') +
          '</tbody>';

        // Send the HTML table as the response
        res.send(`<table>${tableHTML}</table>`);
      });
  } catch (error) {
    console.error('Error viewing file:', error);
    return res.status(500).send('Error viewing file.');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
