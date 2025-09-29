module.exports = {
  // Các thiết lập khác...
  plugins: [
    "react-hooks",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",        // Kiểm tra quy tắc hooks
    "react-hooks/exhaustive-deps": "warn"         // Kiểm tra các dependencies trong hooks
  },
};
