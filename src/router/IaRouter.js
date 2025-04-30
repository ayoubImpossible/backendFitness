const express = require('express');
const router = express.Router();
const { getProgrammeIA } = require('../Controller/AiControler');

// Route IA
router.get('/programmeIA/:uid', getProgrammeIA);

module.exports = router;
