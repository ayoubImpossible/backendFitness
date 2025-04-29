const express = require('express');
const router = express.Router();
const { getProgrammeIA } = require('../Controller/AiControler');

// Route IA
router.get('/programmeIA/:levelId/:exerciseId', getProgrammeIA);

module.exports = router;
