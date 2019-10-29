const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

const router = express.Router();

//*** Photo serving ************************************//
router.get("/photo/:reviewPhoto", reviewController.getPhoto);

//*** Users routes ************************************//
router.use(authController.protect);

//*** API features *************************************//

router
  .route("/status/:status/page/:statusPage")
  .get(reviewController.getStatus);

router.route("/status/:status").get(reviewController.getStatus);

router.route("/find/:name").get(reviewController.getByName);

router.route("/statistic/").get(reviewController.getStatistic);

router
  .route("/my/reviews/:page")
  .get(userController.getMe, reviewController.getAllUserReviews);

router
  .route("/my/reviews/")
  .get(userController.getMe, reviewController.getAllUserReviews)
  .post(
    // reviewController.upLoadReviewImage,
    // reviewController.resizeReviewImage,
    reviewController.createReview,
    reviewController.upLoadReviewImage,
    reviewController.resizeReviewImage,
    reviewController.updateUserReview
  );

router
  .route("/my/:id")
  .get(reviewController.getUserReview)
  .patch(
    reviewController.upLoadReviewImage,
    reviewController.resizeReviewImage,
    reviewController.updateUserReview
  )

  .delete(reviewController.deleteUserReview);

//*** Admins routes ***********************************//
router.use(authController.protect, authController.restrictTo("admin"));

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(reviewController.createReview);

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    reviewController.upLoadReviewImage,
    reviewController.resizeReviewImage,
    reviewController.updateReview
  )
  .delete(reviewController.deleteReview);

module.exports = router;
