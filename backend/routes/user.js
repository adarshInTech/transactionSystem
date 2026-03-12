const express = require("express");
const bcryptjs = require("bcryptjs");
const z = require("zod");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware/middleware.js");
const { User, Account } = require("../models/users");

const router = express.Router();

const signupBody = z.object({
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
});
const signinBody = z.object({
  email: z.email(),
  password: z.string(),
});

const updateBody = z.object({
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
router.post("/signup", async (req, res, next) => {
  try {
    const { success } = signupBody.safeParse(req.body);

    if (!success) {
      return res.status(411).json({
        message: "invalid inputs",
      });
    }

    const existingUser = await User.findOne({
      email: req.body.email,
    });
    if (existingUser) {
      return res.status(411).json({
        message: "email already taken ",
      });
    }

    const hashedPassword = await bcryptjs.hash(req.body.password, 10);

    const user = await User.create({
      email: req.body.email,
      password: hashedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const userId = user._id;

    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });

    res.status(200).json({
      message: "user created successfully",
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const { success } = signinBody.safeParse(req.body);
    if (!success) {
      return res.status(411).json({
        message: "incorrect inputs",
      });
    }
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(411).json({
        message: "user not found",
      });
    }
    const comparePassword = await bcryptjs.compare(
      req.body.password,
      user.password,
    );

    if (!comparePassword) {
      return res.status(411).json({
        message: "invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
    );

    res.status(200).json({
      token,
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);

  try {
    if (!success) {
      return res.status(411).json({
        message: "error while updating information",
      });
    }

    await User.updateOne({ _id: req.userId }, req.body);

    res.json({
      message: "updated successfully",
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/bulk", async (req, res, next) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });
  res.json({
    user: users.map((user) => ({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});
module.exports = router;
