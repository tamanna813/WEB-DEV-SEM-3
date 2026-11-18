const express = require("express");
const Note = require("../models/Note");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

// GET /api/notes - list only the logged-in user's notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notes", error: error.message });
  }
});

// POST /api/notes - create a note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });

    const note = await Note.create({ title, content, owner: req.user._id });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: "Could not create note", error: error.message });
  }
});

// PUT /api/notes/:id - update an owned note
router.put("/:id", async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { ...(title !== undefined && { title }), ...(content !== undefined && { content }) },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Could not update note", error: error.message });
  }
});

// DELETE /api/notes/:id - delete an owned note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete note", error: error.message });
  }
});

module.exports = router;
