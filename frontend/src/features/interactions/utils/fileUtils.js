export const getFileIcon = (fileName) => {
  if (!fileName) return "📁";
  const extension = fileName.split('.').pop().toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoTypes = ['mp4', 'mov', 'avi', 'mkv'];
  const audioTypes = ['mp3', 'wav', 'm4a', 'flac'];
  const docTypes = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];

  if (imageTypes.includes(extension)) return "🖼️";
  if (videoTypes.includes(extension)) return "🎥";
  if (audioTypes.includes(extension)) return "🎵";
  if (docTypes.includes(extension)) return "📄";
  return "📁";
};