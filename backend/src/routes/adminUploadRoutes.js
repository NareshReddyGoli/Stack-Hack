const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../controllers/uploadController');

const router = express.Router();

router.use(requireAdmin);

router.post('/upload/init', upload.initUpload);
router.post('/upload/chunk', upload.uploadChunk);
router.post('/upload/commit', upload.commit);
router.get('/upload/:uploadId/status', upload.status);
router.post('/upload/single', upload.single);
router.get('/samples', upload.sample);
router.get('/upload/:uploadId/errors', upload.errorsCsv);

module.exports = router;


