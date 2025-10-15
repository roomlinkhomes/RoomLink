const express = require("express");
const Message = require("../models/message");
const Listing = require("../models/Listing"); // 👈 you'll need this model

const router = express.Router();

/**
 * @route   POST /api/messages
 * @desc    Send a new message (only if listing is available)
 */
router.post("/", async (req, res) => {
  try {
    const { listingId, senderId, receiverId, content } = req.body;

    if (!listingId || !senderId || !receiverId || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.status === "rented") {
      return res.status(400).json({ error: "Cannot send messages for rented listings" });
    }

    const newMessage = new Message({
      listingId,
      senderId,
      receiverId,
      content,
      listingStatus: listing.status,
      read: false,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * @route   GET /api/messages/:userId
 * @desc    Get all messages for a user (either sender or receiver)
 *          Populates listing info for frontend
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("listingId", "title price status")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * @route   GET /api/messages/listing/:listingId/:user1/:user2
 * @desc    Get all messages between two users for a specific listing
 */
router.get("/listing/:listingId/:user1/:user2", async (req, res) => {
  try {
    const { listingId, user1, user2 } = req.params;

    const messages = await Message.find({
      listingId,
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Mark a message as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/**
 * @route   GET /api/messages/conversations/:userId
 * @desc    Get all conversation threads for a user (latest message per thread)
 */
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Message.aggregate([
      {
        $match: { $or: [{ senderId: userId }, { receiverId: userId }] },
      },
      { $sort: { createdAt: -1 } }, // newest first
      {
        $group: {
          _id: {
            listingId: "$listingId",
            otherUser: {
              $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
            },
          },
          latestMessage: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latestMessage" } },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
