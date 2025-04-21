// MongoDB cleanup script for user_conversations
var collection = db.getCollection('user_conversations');

// 1. Remove duplicates: For each (userId, conversationId), keep only one document
collection.aggregate([
  { $group: {
      _id: { userId: "$userId", conversationId: "$conversationId" },
      count: { $sum: 1 },
      docs: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
]).forEach(function(dup) {
  var keep = dup.docs[0];
  dup.docs.slice(1).forEach(function(id) {
    collection.deleteOne({ _id: id });
    print('Removed duplicate _id: ' + id + ' for userId: ' + dup._id.userId + ', conversationId: ' + dup._id.conversationId);
  });
});

// 2. Create unique index to prevent future duplicates
collection.createIndex({ userId: 1, conversationId: 1 }, { unique: true });
print('Created unique index on { userId, conversationId }');
