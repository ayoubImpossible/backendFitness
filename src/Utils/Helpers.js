const { bucket, db } = require('../Firebase/firebaseAdmin');
const { v4: uuidv4 } = require('uuid'); // For unique filenames

// Function to upload an image to Firebase Storage
const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(`images/${uniqueFileName}`);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => reject(error));

    blobStream.on('finish', async () => {
      // Set expiration to 100 years from now
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 100);

      const imageUrl = await fileUpload.getSignedUrl({
        action: 'read',
        expires: expirationDate,  // Use Date object for expiration
      });

      resolve(imageUrl[0]);
    });

    blobStream.end(file.buffer);
  });
};

// Function to upload a user profile image to Firebase Storage
const uploadImageUser = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(`profileImages/${uniqueFileName}`);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => reject(error));

    blobStream.on('finish', async () => {
      // Set expiration to 100 years from now
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 100);

      const imageUrl = await fileUpload.getSignedUrl({
        action: 'read',
        expires: expirationDate,  // Use Date object for expiration
      });

      resolve(imageUrl[0]);
    });

    blobStream.end(file.buffer);
  });
};

// Delete image from Firebase Storage
const deleteImageFromStorage = (imageUrl) => {
  return new Promise(async (resolve, reject) => {
    if (!imageUrl) {
      return resolve(); // No image URL to delete, return early
    }

    // Extract the file name from the image URL
    const fileName = decodeURIComponent(new URL(imageUrl).pathname.split('/').pop());
    const file = bucket.file(`images/${fileName}`);

    try {
      await file.delete();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Function to upload video to Firebase Storage
const uploadVideoToStorage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided for upload'));

    const videoFileName = `${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(`videos/${videoFileName}`);

    const blobStream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype }, // Ensure the video file type is correctly set
    });

    blobStream.on('error', (error) => {
      reject(new Error(`Video upload failed: ${error.message}`));
    });

    blobStream.on('finish', async () => {
      try {
        // Set expiration to 100 years from now
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 100); // Set to 100 years from now
        const [videoUrl] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: expirationDate, // Use a valid expiration date
        });
        resolve(videoUrl);
      } catch (error) {
        reject(new Error(`Failed to generate signed URL for video: ${error.message}`));
      }
    });

    blobStream.end(file.buffer); // Finalize the upload stream
  });
};

// Delete video from Firebase Storage
const deleteVideoFromStorage = async (videoUrl) => {
  if (!videoUrl) return Promise.resolve(); // Exit if no video URL is provided

  try {
    const fileName = decodeURIComponent(new URL(videoUrl).pathname.split('/').pop());
    const file = bucket.file(`videos/${fileName}`);

    await file.delete(); // Delete the file from the bucket
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(new Error(`Failed to delete video: ${error.message}`));
  }
};

// Get all levels with their videos
const getLevelsWithVideos = async (typeId, categoryId, exerciseId, atackId) => {
  const levelsRef = db.collection('types').doc(typeId)
                             .collection('categories').doc(categoryId)
                             .collection('exercises').doc(exerciseId)
                             .collection('atack').doc(atackId).collection('levels');

  const levelsSnapshot = await levelsRef.get();
  const levels = [];

  for (const levelDoc of levelsSnapshot.docs) {
    const levelData = levelDoc.data();
    const levelId = levelDoc.id;

    const videosRef = levelsRef.doc(levelId).collection('videos');
    const videosSnapshot = await videosRef.get();
    const videos = videosSnapshot.docs.map(videoDoc => ({
      id: videoDoc.id,
      ...videoDoc.data()
    }));

    levels.push({
      id: levelId,
      ...levelData,
      videos: videos
    });
  }
  return levels;
};

module.exports = {
  uploadVideoToStorage,
  deleteVideoFromStorage,
  getLevelsWithVideos,
  uploadImage,
  deleteImageFromStorage,
  uploadImageUser
};
