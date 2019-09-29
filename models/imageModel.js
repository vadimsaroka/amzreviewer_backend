const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    new: true,
    overwrite: true
  },
  imageCover: { data: Buffer, contentType: String },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  }
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
