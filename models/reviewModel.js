const mongoose = require("mongoose");
const validator = require("validator");

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A review must have a name"],
      trim: true,
      maxlength: [
        200,
        "A tour review must have less or equal then 200 characters"
      ],
      minlength: [
        10,
        "A tour review must have more or equal then 10 characters"
      ],
      lowercase: true
    },
    imageCover: {
      type: String,
      default:
        "https://amzreviewserver.herokuapp.com/api/v1/reviews/photo/default-review.jpeg"
    },
    price: {
      type: Number,
      required: [true, "A review must have a price"]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    status: {
      type: String,
      enum: {
        values: [
          "ordered",
          "delivered",
          "reviewsent",
          "reviewgot",
          "paid",
          "sold"
        ],
        message:
          "Status is either: ordered, delivered, reviewsent, reviewgot, paid, sold"
      },
      default: "ordered"
    },
    groupName: {
      type: String,
      trim: true,
      required: [true, "A review must have a group"]
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "Unknown"
    },
    email: {
      type: String,
      lowercase: true,
      // validate: [validator.isEmail, "Please provide a valid email"]
    },
    orderDate: {
      type: Date,
      default: Date.now()
    },
    orderNumber: {
      type: String,
      trim: true,
      required: [true, "A review must have a order number"]
    },
    amazonAcc: {
      type: String,
      trim: true
    },
    gotMoney: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User"
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.virtual("result").get(function() {
  if (this.status === "paid" || this.status === "sold") {
    return -this.price + this.gotMoney + this.sold;
  } else {
    return 0;
  }
});

reviewSchema.virtual("fee").get(function() {
  if (this.status === "paid" || this.status === "sold") {
    return this.price - this.gotMoney;
  } else {
    return 0;
  }
});

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "user",
    select: "photo name"
  });

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
