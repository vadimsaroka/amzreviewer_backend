const User = require("./../models/userModel");
const Review = require("./../models/reviewModel");
const sharp = require("sharp");
const multer = require("multer");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

const fs = require("fs");
const Image = require("./../models/imageModel");

// Get user data*******************************************//
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User, "reviews");

//*********************************************************//
// Upload user photo **************************************//
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// exports.upLoadUserPhoto = upload.single("photo");
exports.upLoadUserPhoto = upload.single("imageCover");
//*********************************************************//
// Resize user photo **************************************//
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `https://amzreviewserver.herokuapp.com/api/v1/users/photo/user-${req.user.id}.jpeg`;

  await sharp(req.file.buffer)
    .rotate()
    .resize(250, 250)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/user-${req.user.id}.jpeg`);

  const imagePath = `public/img/users/user-${req.user.id}.jpeg`;

  // Check if an image already exist
  const updateImage = await Image.findOne({ name: `user-${req.user.id}.jpeg` });

  if (!updateImage) {
    const newImage = new Image();
    newImage.imageCover.data = fs.readFileSync(imagePath);
    newImage.name = `user-${req.user.id}.jpeg`;
    newImage.imageCover.contentType = "image/jpeg";
    newImage.save();
  } else {
    await Image.findOneAndUpdate(
      { name: `user-${req.user.id}.jpeg` },
      {
        name: `user-${req.user.id}.jpeg`,
        imageCover: {
          data: fs.readFileSync(imagePath),
          contentType: "image/jpeg"
        }
      }
    );
  }
  next();
});

// Send an image ******************************************//
exports.getPhoto = catchAsync(async (req, res, next) => {
  const photo = await Image.findOne({ name: req.params.userPhoto });

  if (!photo) {
    doc = await Image.findOne({ name: "default.jpeg" });
    res.contentType(doc.imageCover.contentType);
    res.send(doc.imageCover.data);
  } else {
    res.contentType(photo.imageCover.contentType);
    res.send(photo.imageCover.data);
  }
});

// Update user photo and email ****************************//
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

// Delete current user ************************************//
exports.deleteMe = catchAsync(async (req, res, next) => {
  const userReviews = await User.findById(req.user.id).populate("reviews");

  userReviews.reviews.map(async review => {
    await Image.findOneAndDelete({ name: `review-${review._id}.jpeg` });
    await Review.findByIdAndDelete(review._id);
  });

  await Image.findOneAndDelete({ name: `user-${req.user.id}.jpeg` });
  await User.findByIdAndDelete(req.user.id);

  res.cookie("jwt", "deleted", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(204).json({
    status: "deleted",
    data: null
  });
});

// Create user ********************************************//
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead"
  });
};

// Admin routes
// Get all users ******************************************//
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
// Update User ********************************************//
exports.updateUser = factory.updateOne(User);

// Delete User ********************************************//
exports.deleteUser = factory.deleteOne(User);
