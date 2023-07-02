const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const cors = require('cors');
const csvParser = require('csv-parser');

// Connect to MongoDB
mongoose.connect('mongodb+srv://plan:plan@cluster0.yuuofm2.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(cors());

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String
  },
  filePath : {
    type:String
  },
  file: {
    type: String
  }
}, {
  timestamps: {
    options: { timeZone: 'Asia/Kolkata' }
  }
});

const File = mongoose.model("File", fileSchema);

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/files');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API endpoint to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const file = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
      file: req.file.filename
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
    const files = await File.find();
    return res.json(files);
  } catch (error) {
    console.error('Error retrieving file list:', error);
    return res.status(500).send('Error retrieving file list.');
  }
});

// API endpoint to handle file deletion
app.get('/delete/:file', async (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(__dirname, 'uploads', 'files', fileName);

  try {
    await File.deleteOne({ file: fileName });

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
  const file = await File.findOne({ file: fileName });

  if (!file) {
    return res.status(404).send('File not found.');
  }

  const filePath = path.join(__dirname, file.filePath);

  try {
    const results = [];
    const header = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headers) => {
        header.push(...headers);
      })
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        const tableHTML =
          '<thead><tr>' +
          header.map((cell) => `<th>${cell}</th>`).join('') +
          '</tr></thead><tbody>' +
          results
            .map((row) => '<tr>' + header.map((cell) => `<td>${row[cell]}</td>`).join('') + '</tr>')
            .join('') +
          '</tbody>';

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
