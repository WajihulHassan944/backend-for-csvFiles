const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://plan:plan@cluster0.yuuofm2.mongodb.net/?retryWrites=true&w=majority', {
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

// API endpoint to render the home page
app.get('/', (req, res) => {
  res.send("786");
});

// API endpoint to handle file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create a new file record in the database
  try {
    const file = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
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
  const filePath = path.join('uploads', fileName);

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

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
