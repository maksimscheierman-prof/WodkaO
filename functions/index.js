const admin = require("firebase-admin");
const {
  createGenerateCommentatorComment,
} = require("./src/generateCommentatorComment");

admin.initializeApp();

exports.generateCommentatorComment = createGenerateCommentatorComment();
