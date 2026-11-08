export const formatAIContent = (content) => {
  if (!content) return "";

  return content
    // 1. Chống lỗi double backslash từ JSON trước
    .replace(/\\\\/g, "\\")
    // 2. Wrap các ký tự tiếng Việt trong Math Mode bằng \text{} 
    
    .replace(/\$([^\$]+)\$/g, (match, p1) => {
      const containsVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(p1);
      return containsVietnamese ? `$ \text{${p1}} $` : match;
    })
    // 3. Chuyển đổi các dạng ngoặc của AI về chuẩn $ và $$
    .replace(/\\\(|\\\)/g, "$")
    .replace(/\\\[|\\\]/g, "$$")
    // 4. Chỉ thêm xuống dòng cho văn bản thường, tránh làm hỏng cấu trúc Math
    .split('\n').map(line => {
      
      if (line.includes('$')) return line;
      return line + "  ";
    }).join('\n');
};