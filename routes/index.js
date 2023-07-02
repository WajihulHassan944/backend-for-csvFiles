/** ------------------ IMPORTING PACKAGE ------------------ **/
const express = require('express');
const router = express.Router();
const multer = require('multer');

/** ------------------ IMPORTING CONTROLLERS ------------------ **/
const fileController = require('../controllers/file_controller');
const upload = multer({ dest: 'uploads/files'})

/** ------------------ MAKING ROUTES ------------------ **/
router.post('/upload', upload.single('file') ,fileController.upload);
router.get('/view/:id', fileController.view);
router.get('/delete/:id', fileController.delete);


/** ------------------ EXPORTING ROUTER ------------------ **/
module.exports = router;
