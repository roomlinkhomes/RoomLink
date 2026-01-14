// firebase/reviewService.js — FIXED & TRANSACTION SAFE VERSION
import { db } from "../firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// ----------------------------
// 1. LISTING REVIEW — TRANSACTION SAFE
// ----------------------------
export const addListingReview = async (
  listingId,
  rating,
  reviewerId,
  reviewerName = "Anonymous",
  comment = ""
) => {
  const numericRating = Number(rating);

  // Validation
  if (!listingId) throw new Error("Missing listingId");
  if (!reviewerId) throw new Error("Missing reviewerId (current user UID)");
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error(`Invalid rating: must be 1–5 (received: ${rating})`);
  }
  if (!comment || comment.trim().length < 3) {
    throw new Error("Comment must be at least 3 characters long");
  }

  const cleanName = reviewerName?.toString().trim() || "Anonymous";

  await runTransaction(db, async (transaction) => {
    const listingRef = doc(db, "listings", listingId);
    const listingSnap = await transaction.get(listingRef);
    if (!listingSnap.exists()) throw new Error("Listing not found");

    const vendorId =
      listingSnap.data().posterId ||
      listingSnap.data().authorId ||
      listingSnap.data().uid;
    if (!vendorId) throw new Error("Vendor not found");

    const vendorRef = doc(db, "users", vendorId);
    const vendorSnap = await transaction.get(vendorRef);
    if (!vendorSnap.exists()) throw new Error("Vendor not found");

    const oldAvg = vendorSnap.data()?.averageRating || 0;
    const oldCount = vendorSnap.data()?.reviewCount || 0;
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + numericRating) / newCount;

    // Update vendor rating atomically
    transaction.update(vendorRef, {
      averageRating: Number(newAvg.toFixed(2)),
      reviewCount: newCount,
    });

    // Add review atomically
    const reviewRef = doc(collection(db, "listings", listingId, "reviews"));
    transaction.set(reviewRef, {
      userId: reviewerId, // MUST match security rules
      userName: cleanName,
      rating: numericRating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });
  });
};

// ----------------------------
// 2. PROFILE RATING — TRANSACTION SAFE
// ----------------------------
export const addReview = async (
  targetUserId,
  rating,
  reviewerId,
  reviewerName = "Anonymous"
) => {
  const numericRating = Number(rating);

  // Validation
  if (!targetUserId) throw new Error("Missing targetUserId – cannot rate this user");
  if (!reviewerId) throw new Error("Missing reviewerId (current user UID)");
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error(`Invalid rating: must be 1–5 (received: ${rating})`);
  }

  const cleanName = reviewerName?.toString().trim() || "Anonymous";

  await runTransaction(db, async (transaction) => {
    const targetRef = doc(db, "users", targetUserId);
    const targetSnap = await transaction.get(targetRef);
    if (!targetSnap.exists()) throw new Error("User not found");

    const oldAvg = targetSnap.data()?.averageRating || 0;
    const oldCount = targetSnap.data()?.reviewCount || 0;
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + numericRating) / newCount;

    // Update target user rating atomically
    transaction.update(targetRef, {
      averageRating: Number(newAvg.toFixed(2)),
      reviewCount: newCount,
    });

    // Add review atomically
    const reviewRef = doc(collection(db, "users", targetUserId, "reviews"));
    transaction.set(reviewRef, {
      userId: reviewerId,       // MUST match security rules
      reviewerId,               // optional duplicate
      reviewerName: cleanName,
      rating: numericRating,
      createdAt: serverTimestamp(),
    });
  });
};
