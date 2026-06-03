const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.join(__dirname, '../../..');

// Get all modified and untracked files in src and prisma
function getFilesToAudit() {
  const statusOutput = execSync('git status --porcelain', { cwd: workspaceRoot }).toString();
  const files = [];
  statusOutput.split('\n').forEach(line => {
    if (!line.trim()) return;
    const filePath = line.substring(3).trim();
    // Only audit source files in backend/src, frontend/src, prisma
    if (
      (filePath.startsWith('my-web/backend/src/') || 
       filePath.startsWith('my-web/frontend/src/') ||
       filePath.startsWith('my-web/backend/prisma/')) &&
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.prisma') || filePath.endsWith('.js'))
    ) {
      files.push(filePath);
    }
  });
  return files;
}

function auditFile(relativeFilePath) {
  const absolutePath = path.join(workspaceRoot, relativeFilePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const errors = [];

  // Rule 1: Header Comments
  const firstLine = lines[0] ? lines[0].trim() : '';
  const secondLine = lines[1] ? lines[1].trim() : '';
  const hasHeader = firstLine.startsWith('/**') || firstLine.startsWith('//') || (relativeFilePath.endsWith('.prisma') && firstLine.startsWith('//'));
  if (!hasHeader) {
    errors.push('Thiếu khối bình luận mô tả (Header Comment) ở dòng đầu tiên.');
  }

  // Rule 2: Double Empty Lines (consecutive empty lines in code)
  let consecutiveEmpty = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      consecutiveEmpty++;
    } else {
      if (consecutiveEmpty >= 2) {
        errors.push(`Có ${consecutiveEmpty} dòng trống liên tiếp ở các dòng ${i - consecutiveEmpty + 1} đến ${i}.`);
      }
      consecutiveEmpty = 0;
    }
  }

  // Rule 3: Ends with exactly 1 newline
  // An empty line at the end means lines[lines.length - 1] is empty and lines[lines.length - 2] is not empty (if it's exactly 1 trailing newline)
  // Let's check:
  if (content.length > 0) {
    const endsWithNewline = content.endsWith('\n');
    const endsWithDoubleNewline = content.endsWith('\n\n') || content.endsWith('\r\n\r\n');
    if (!endsWithNewline) {
      errors.push('Cuối tệp tin không có dòng trống kết thúc (newline).');
    } else if (endsWithDoubleNewline) {
      // Find how many trailing newlines there are
      let trailingNewlines = 0;
      let idx = content.length - 1;
      while (idx >= 0 && (content[idx] === '\n' || content[idx] === '\r')) {
        if (content[idx] === '\n') trailingNewlines++;
        idx--;
      }
      if (trailingNewlines > 1) {
        errors.push(`Có ${trailingNewlines} dòng trống dư thừa ở cuối tệp tin.`);
      }
    }
  }

  // Rule 4: Type 'any' checking (only for typescript files)
  if (relativeFilePath.endsWith('.ts') || relativeFilePath.endsWith('.tsx')) {
    const anyTypeRegex = /\bany\b/g;
    lines.forEach((line, idx) => {
      // Strip comments to avoid false positives
      const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      // Check if it contains ': any' or 'as any' or '<any>'
      if (
        cleanLine.includes(': any') || 
        cleanLine.includes('as any') || 
        cleanLine.includes('<any>') ||
        (cleanLine.includes('any[]') && !cleanLine.includes('any[] = []'))
      ) {
        errors.push(`Dòng ${idx + 1}: Sử dụng kiểu 'any' (${line.trim()}).`);
      }
    });
  }

  return errors;
}

function main() {
  const files = getFilesToAudit();
  console.log(`Tìm thấy ${files.length} tệp tin cần rà soát.`);
  let totalErrors = 0;

  files.forEach(file => {
    const fileErrors = auditFile(file);
    if (fileErrors.length > 0) {
      console.log(`\n❌ [${file}]:`);
      fileErrors.forEach(err => console.log(`  - ${err}`));
      totalErrors += fileErrors.length;
    } else {
      console.log(`\n✅ [${file}]: Đạt`);
    }
  });

  console.log(`\nTổng số lỗi phát hiện: ${totalErrors}`);
}

main();
