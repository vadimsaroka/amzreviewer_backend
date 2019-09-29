const Review = require("./../models/reviewModel");
const multer = require("multer");
const sharp = require("sharp");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");
const AppError = require("./../utils/appError");

const fs = require("fs");
const Image = require("./../models/imageModel");

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

exports.upLoadReviewImage = upload.single("imageCover");

exports.resizeReviewImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  reviewImage = `https://amzreviewserver.herokuapp.com/api/v1/reviews/photo/review-${req.params.id}.jpeg`;

  await sharp(req.file.buffer)
    .rotate()
    .resize(400, 400)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/reviews/review-${req.params.id}.jpeg`);

  const imagePath = `public/img/reviews/review-${req.params.id}.jpeg`;

  // Check if an image already exist
  const updateImage = await Image.findOne({
    name: `review-${req.params.id}.jpeg`
  });

  if (!updateImage) {
    const newImage = new Image();
    newImage.imageCover.data = fs.readFileSync(imagePath);
    newImage.name = `review-${req.params.id}.jpeg`;
    newImage.imageCover.contentType = "image/jpeg";
    newImage.save();
  } else {
    await Image.findOneAndUpdate(
      { name: `review-${req.params.id}.jpeg` },
      {
        name: `review-${req.params.id}.jpeg`,
        imageCover: {
          data: fs.readFileSync(imagePath),
          contentType: "image/jpeg"
        }
      }
    );
  }

  req.body.imageCover = reviewImage;
  next();
});

exports.getPhoto = catchAsync(async (req, res, next) => {
  const { reviewPhoto } = req.params;
  const photo = await Image.findOne({ name: reviewPhoto });

  if (!photo) {
    doc = await Image.findOne({ name: "default-review.jpeg" });
    res.contentType(doc.imageCover.contentType);
    res.send(doc.imageCover.data);
  } else {
    res.contentType(photo.imageCover.contentType);
    res.send(photo.imageCover.data);
  }
});

exports.getAllReviews = factory.getAll(Review);

exports.createReview = catchAsync(async (req, res, next) => {
  const data = req.body;

  data.user = req.user._id;

  const doc = await Review.create(data);

  res.status(201).json({
    status: "success",
    data: {
      data: doc
    }
  });
});

// exports.getReview = factory.getOne(Review, "user");
exports.getReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);

// Users routes
exports.getAllUserReviews = catchAsync(async (req, res, next) => {
  // let query = User.findById(req.params.id).populate("reviews");
  // const doc = await query;

  const page = req.params.page || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const currentUser = req.user._id;

  let length = Review.find({}).where({ user: currentUser });

  let query = Review.find({})
    .where({ user: currentUser })
    .sort({ orderDate: -1 })
    .skip(skip)
    .limit(limit);

  const doc = await query;

  const info = await length;

  let price = 0;
  info.map(e => {
    price += e.price;
  });

  if (!doc) {
    return next(new AppError("No document found", 404));
  }

  res.status(200).json({
    status: "success",
    results: info.length,
    moneySpent: price.toFixed(2),
    data: {
      data: doc
    }
  });
});

exports.deleteUserReview = catchAsync(async (req, res, next) => {
  // 1) review id   2) user id
  let query = Review.findByIdAndDelete(req.params.id);
  const doc = await query;

  await Image.findOneAndDelete({ name: `review-${req.params.id}.jpeg` });

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  if (JSON.stringify(doc.user._id) !== JSON.stringify(req.user._id)) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getUserReview = catchAsync(async (req, res, next) => {
  let query = Review.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  if (JSON.stringify(doc.user._id) !== JSON.stringify(req.user._id)) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      data: doc
    }
  });
});

exports.updateUserReview = catchAsync(async (req, res, next) => {
  let query = Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  const doc = await query;

  if (!doc) {
    return next(new AppError("No document found with that ID", 404));
  }

  if (JSON.stringify(doc.user._id) !== JSON.stringify(req.user._id)) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      data: doc
    }
  });
});

exports.getStatus = catchAsync(async (req, res, next) => {
  const { status, statusPage } = req.params;
  const currentUser = req.user._id;

  const page = statusPage || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  let length = Review.find({ status: status }).where({ user: currentUser });

  let query = Review.find({
    status: status
  })
    .where({ user: currentUser })
    .sort({ orderDate: -1 })
    .skip(skip)
    .limit(limit);

  const doc = await query;

  const info = await length;

  let price = 0;
  info.map(e => {
    price += e.price;
  });

  res.status(200).json({
    status: "success",
    results: info.length,
    moneySpent: price.toFixed(2),
    data: {
      data: doc
    }
  });
});

exports.getByName = catchAsync(async (req, res, next) => {
  const { name } = req.params;
  const currentUser = req.user._id;

  let query = Review.find({
    name: { $regex: new RegExp(name.toLowerCase()) }
  })
    .where({ user: currentUser })
    .limit(10);

  const doc = await query;

  let price = 0;
  doc.map(e => {
    price += e.price;
  });

  res.status(200).json({
    status: "success",
    results: doc.length,
    moneySpent: price.toFixed(2),
    data: {
      data: doc
    }
  });
});

exports.getStatistic = catchAsync(async (req, res, next) => {
  const currentUser = req.user._id;

  const currentYear = new Date().getUTCFullYear();

  let moneySpent = [];
  let fee = [];
  let result = [];
  let reviews = [];

  for (let i = 1; i <= 12; i++) {
    const date = new Date(`${currentYear}-${i}-1`);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    let query = Review.find({
      // status: { $in: ["paid", "sold"] },
      orderDate: {
        $gte: firstDay,
        $lte: lastDay
      }
    }).where({ user: currentUser });

    const doc = await query;

    let sum = 0;
    let fees = 0;
    let results = 0;

    if (doc.length > 0) {
      for (let j = 0; j < doc.length; j++) {
        sum += doc[j].price;
        fees += doc[j].fee;
        results += doc[j].result;
      }
    }
    moneySpent.push(sum.toFixed(2));
    fee.push(fees.toFixed(2));
    result.push(results.toFixed(2));
    reviews.push(doc.length.toFixed(2));
  }

  res.status(200).json({
    status: "success",
    statistic: {
      moneySpent: moneySpent,
      fee: fee,
      result: result,
      reviews: reviews
    }
  });
});
