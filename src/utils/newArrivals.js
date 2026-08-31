const MAX_UPLOAD_GAP_MS = 10 * 60 * 1000;

export const selectLatestUploadBatch = (images = []) => {
  const sortedImages = [...images].sort((a, b) => Date.parse(b.created_date) - Date.parse(a.created_date));
  if (!sortedImages.length) return [];

  const latestBatch = [sortedImages[0]];

  for (let index = 1; index < sortedImages.length; index += 1) {
    const previousDate = Date.parse(sortedImages[index - 1].created_date);
    const currentDate = Date.parse(sortedImages[index].created_date);

    if (!Number.isFinite(previousDate) || !Number.isFinite(currentDate) || previousDate - currentDate > MAX_UPLOAD_GAP_MS) {
      break;
    }

    latestBatch.push(sortedImages[index]);
  }

  return latestBatch;
};
