import toast from 'react-hot-toast';

/**
 * Exports data to CSV with support for custom headers and formatting.
 * @param {Array} headers - Array of string headers
 * @param {Array} rows - Array of arrays, each representing a row of data
 * @param {string} filename - The name of the file to save as
 */
export const handleExportCSV = (headers, rows, filename) => {
  if (!rows || rows.length === 0) {
    toast.error('No data to export');
    return;
  }
  
  const escapeCSV = (val) => {
    const stringVal = String(val === null || val === undefined ? '' : val);
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');

  const csvContent = "\uFEFF" + headerRow + "\n" + dataRows; // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

