const router = require("express").Router();
const User = require("../model/User");
const CryptoJS = require("crypto-js");

// Get
router.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const { password, ...info } = user._doc;
    res.status(200).json(info);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get All
router.get("/", async (req, res, next) => {
  const query = req.query.new;
  try {
    const users = query
      ? await User.find({}).sort({ _id: -1 }).limit(5)
      : await User.find({}).sort({ _id: -1 });

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

// Get User Stats
router.get("/stats", async (req, res, next) => {
  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
});

// Update
router.put("/:id", async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      req.body.password = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET_KEY
      ).toString();
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );

      res.status(200).json(updatedUser);
    } catch (err) {
      res.json(500).json(err);
    }
  } else {
    res.status(403).json("You can update only your account");
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);

      res.status(200).json("User has been deleted");
    } catch (err) {
      res.json(500).json(err);
    }
  } else {
    res.status(403).json("You can delete only your account");
  }
});

module.exports = router;
