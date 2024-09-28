const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.send("List of users");
});

router.post("/", (req, res) => {
    const newUser = req.body;
    res.send("Add user: ${JSON.stringify(newUser)}");
});

module.exports = router;