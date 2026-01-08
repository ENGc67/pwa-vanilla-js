/****************************
 * PWA / UI เดิม
 ****************************/

// Button test
document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('status').textContent = '✅ Button Clicked';
});

// Online / Offline
window.addEventListener('online', () => {
  document.getElementById('status').textContent = '🟢 Online';
});

window.addEventListener('offline', () => {
  document.getElementById('status').textContent = '🔴 Offline';
});

// PWA Install Banner
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  installBtn.classList.add('hidden');
  await deferredPrompt.prompt();
  deferredPrompt = null;
});


/****************************
 * Supabase Config (CDN)
 ****************************/

const SUPABASE_URL = 'https://vlqhwnsdheoljyexkpls.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscWh3bnNkaGVvbGp5ZXhrcGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzE2MjAsImV4cCI6MjA4MzMwNzYyMH0.AWHo-1nnu9hdVUivKLC2O98wQhDFA7nhTE1qt9ZeZfs';

// ✅ สำคัญ: ใช้ window.supabase และตั้งชื่อใหม่เป็น db
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/****************************
 * Supabase READ
 ****************************/

// Global variables for data management
let originalData = [];
let currentSort = { column: 'created_at', direction: 'desc' };
let currentFilter = '';
let currentPage = 1;
let itemsPerPage = 10;

/****************************
 * Supabase READ
 ****************************/

async function loadData() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');
  const tableContainer = document.getElementById('tableContainer');
  const dataTableBody = document.getElementById('dataTableBody');

  // Show loading, hide others
  loadingSpinner.classList.remove('d-none');
  errorMessage.classList.add('d-none');
  tableContainer.classList.add('d-none');

  const { data, error } = await db
    .from('ID') // 👈 ชื่อตารางใน Supabase
    .select('*')
    .order('created_at', { ascending: false });

  loadingSpinner.classList.add('d-none');

  if (error) {
    console.error(error);
    errorMessage.textContent = '❌ Error: ' + error.message;
    errorMessage.classList.remove('d-none');
    return;
  }

  // Store original data
  originalData = data;

  // Reset pagination and apply current sort and filter
  resetPagination();
  displayData();

  tableContainer.classList.remove('d-none');
}

/****************************
 * Data Display and Manipulation
 ****************************/

function displayData() {
  const dataTableBody = document.getElementById('dataTableBody');
  const resultCount = document.getElementById('resultCount');

  // Filter data
  let filteredData = originalData.filter(item => {
    if (!currentFilter) return true;

    const searchTerm = currentFilter.toLowerCase();

    // Search across all relevant fields
    const searchableFields = [
      item.NAME || '',
      new Date(item.created_at).toLocaleString(),
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.created_at).toLocaleTimeString(),
      item.created_at, // ISO string
    ];

    return searchableFields.some(field =>
      field.toString().toLowerCase().includes(searchTerm)
    );
  });

  // Sort data
  filteredData.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
      case 'index':
        aVal = originalData.indexOf(a);
        bVal = originalData.indexOf(b);
        break;
      case 'name':
        aVal = (a.NAME || '').toLowerCase();
        bVal = (b.NAME || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Clear existing rows
  dataTableBody.innerHTML = '';

  // Update result count
  if (currentFilter && filteredData.length === 0) {
    resultCount.textContent = `No results found for "${currentFilter}"`;
    resultCount.className = 'text-warning';
  } else {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
    resultCount.textContent = `Showing ${startItem}-${endItem} of ${filteredData.length} records (Page ${currentPage} of ${totalPages})`;
    resultCount.className = 'text-muted';
  }

  // Apply paging
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedData = filteredData.slice(startIndex, endIndex);

  // Populate table
  if (pagedData.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 4; // Updated to 4 columns (added Actions)
    emptyCell.className = 'text-center text-muted py-4';
    emptyCell.innerHTML = currentFilter
      ? `<em>No records match your search for "${currentFilter}"</em>`
      : '<em>No data available</em>';
    emptyRow.appendChild(emptyCell);
    dataTableBody.appendChild(emptyRow);
  } else {
    pagedData.forEach((item, index) => {
      const row = document.createElement('tr');
      row.dataset.id = item.id; // Store the record ID for edit/delete operations

      const indexCell = document.createElement('th');
      indexCell.scope = 'row';
      indexCell.textContent = (currentPage - 1) * itemsPerPage + index + 1;
      row.appendChild(indexCell);

      const nameCell = document.createElement('td');
      nameCell.textContent = item.NAME || 'N/A';
      nameCell.dataset.field = 'name';
      row.appendChild(nameCell);

      const dateCell = document.createElement('td');
      const createdDate = new Date(item.created_at);
      dateCell.textContent = createdDate.toLocaleString();
      row.appendChild(dateCell);

      // Actions column
      const actionsCell = document.createElement('td');
      actionsCell.className = 'text-center';

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-warning me-1';
      editBtn.innerHTML = '✏️ Edit';
      editBtn.onclick = () => enableEditMode(row, item);
      actionsCell.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => deleteRecord(item.id, item.NAME || 'Unknown');
      actionsCell.appendChild(deleteBtn);

      row.appendChild(actionsCell);

      dataTableBody.appendChild(row);
    });
  }

  // Render pagination controls
  renderPagination(filteredData);
}

function sortData(column) {
  // Update sort indicators
  document.querySelectorAll('.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });

  // Toggle sort direction
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
  }

  // Update visual indicator
  const header = document.querySelector(`[data-column="${column}"]`);
  header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');

  // Reset pagination and redisplay data
  resetPagination();
  displayData();
}

function filterData() {
  currentFilter = document.getElementById('searchInput').value.trim();
  resetPagination();
  displayData();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentFilter = '';
  resetPagination();
  displayData();
}

/****************************
 * Edit and Delete Functions
 ****************************/

function enableEditMode(row, item) {
  const nameCell = row.querySelector('[data-field="name"]');
  const actionsCell = row.querySelector('td:last-child');

  // Store original content
  const originalName = nameCell.textContent;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control form-control-sm';
  input.value = originalName === 'N/A' ? '' : originalName;

  // Replace text with input
  nameCell.textContent = '';
  nameCell.appendChild(input);
  input.focus();
  input.select();

  // Replace buttons with Save/Cancel
  actionsCell.innerHTML = '';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-sm btn-success me-1';
  saveBtn.innerHTML = '💾 Save';
  saveBtn.onclick = () => saveEdit(row, item.id, input.value.trim());
  actionsCell.appendChild(saveBtn);

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-sm btn-secondary';
  cancelBtn.innerHTML = '❌ Cancel';
  cancelBtn.onclick = () => cancelEdit(row, originalName);
  actionsCell.appendChild(cancelBtn);

  // Handle Enter/Escape keys
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      saveEdit(row, item.id, input.value.trim());
    } else if (e.key === 'Escape') {
      cancelEdit(row, originalName);
    }
  };
}

function cancelEdit(row, originalName) {
  const nameCell = row.querySelector('[data-field="name"]');
  const actionsCell = row.querySelector('td:last-child');

  // Restore original content
  nameCell.textContent = originalName;

  // Restore original buttons
  actionsCell.innerHTML = '';
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-warning me-1';
  editBtn.innerHTML = '✏️ Edit';
  editBtn.onclick = () => {
    const itemId = row.dataset.id;
    const item = originalData.find(d => d.id === itemId);
    if (item) enableEditMode(row, item);
  };
  actionsCell.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-danger';
  deleteBtn.innerHTML = '🗑️ Delete';
  deleteBtn.onclick = () => {
    const itemId = row.dataset.id;
    const item = originalData.find(d => d.id === itemId);
    if (item) deleteRecord(item.id, item.NAME || 'Unknown');
  };
  actionsCell.appendChild(deleteBtn);
}

async function saveEdit(row, itemId, newName) {
  if (!newName) {
    alert('Name cannot be empty!');
    return;
  }

  try {
    const { error } = await db
      .from('ID')
      .update({ NAME: newName })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating record:', error);
      alert('Error updating record: ' + error.message);
      return;
    }

    // Update local data
    const itemIndex = originalData.findIndex(d => d.id === itemId);
    if (itemIndex !== -1) {
      originalData[itemIndex].NAME = newName;
    }

    // Refresh display
    displayData();

    alert('Record updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while updating the record.');
  }
}

function deleteRecord(itemId, itemName) {
  const confirmed = confirm(`Are you sure you want to delete the record for "${itemName}"?\n\nThis action cannot be undone!`);

  if (!confirmed) return;

  performDelete(itemId, itemName);
}

async function performDelete(itemId, itemName) {
  try {
    const { error } = await db
      .from('ID')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting record:', error);
      alert('Error deleting record: ' + error.message);
      return;
    }

    // Remove from local data
    originalData = originalData.filter(d => d.id !== itemId);

    // Refresh display
    displayData();

    alert(`Record "${itemName}" deleted successfully!`);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while deleting the record.');
  }
}

// ปุ่ม Load Data
const loadBtn = document.getElementById('loadDataBtn');
if (loadBtn) {
  loadBtn.addEventListener('click', loadData);
}

// ปุ่ม Add Item
const addItemBtn = document.getElementById('addItemBtn');
if (addItemBtn) {
  addItemBtn.addEventListener('click', async () => {
    const name = prompt('Enter item name:');
    if (!name || !name.trim()) return;

    const { error } = await db
      .from('ID')
      .insert([{ NAME: name.trim() }]);

    if (error) {
      console.error(error);
      alert('Error adding item: ' + error.message);
      return;
    }

    alert('Item added successfully!');
    loadData(); // Reload data
  });
}

// ปุ่ม Download CSV
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener('click', downloadCSV);
}

/****************************
 * Table Sorting and Filtering
 ****************************/

// Sortable headers
document.querySelectorAll('.sortable').forEach(header => {
  header.addEventListener('click', () => {
    const column = header.dataset.column;
    sortData(column);
  });
});

// Search input
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', filterData);

  // Add keyboard shortcuts
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
      searchInput.blur(); // Remove focus
    }
  });
}

// Clear search button
const clearSearchBtn = document.getElementById('clearSearchBtn');
if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', clearSearch);
}

// Items per page selector
const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
if (itemsPerPageSelect) {
  itemsPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    resetPagination();
    displayData();
  });
}


function downloadCSV() {
  if (originalData.length === 0) {
    alert('No data to download!');
    return;
  }

  // Get filtered data (same logic as displayData)
  let filteredData = originalData.filter(item => {
    if (!currentFilter) return true;

    const searchTerm = currentFilter.toLowerCase();

    const searchableFields = [
      item.NAME || '',
      new Date(item.created_at).toLocaleString(),
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.created_at).toLocaleTimeString(),
      item.created_at,
    ];

    return searchableFields.some(field =>
      field.toString().toLowerCase().includes(searchTerm)
    );
  });

  // Sort data (same as displayData)
  filteredData.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
      case 'index':
        aVal = originalData.indexOf(a);
        bVal = originalData.indexOf(b);
        break;
      case 'name':
        aVal = (a.NAME || '').toLowerCase();
        bVal = (b.NAME || '').toLowerCase();
        break;
      case 'created_at':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Create CSV content
  let csv = 'Index,Name,Created At\n';
  filteredData.forEach((item, index) => {
    const name = item.NAME || 'N/A';
    const createdAt = new Date(item.created_at).toLocaleString();
    csv += `${index + 1},"${name.replace(/"/g, '""')}","${createdAt}"\n`;
  });

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'data.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.getElementById('helloBtn').addEventListener('click', async () => {
  const input = document.getElementById('username');
  const greeting = document.getElementById('greeting');
  const name = input.value.trim();

  if (!name) {
    greeting.textContent = '❗ กรุณาใส่ชื่อ';
    greeting.className = 'alert alert-warning';
    greeting.classList.remove('d-none');
    return;
  }

  greeting.textContent = '⏳ Saving...';
  greeting.className = 'alert alert-info';
  greeting.classList.remove('d-none');

  const { error } = await db
    .from('ID')
    .insert([{ NAME: name }]);

  if (error) {
    console.error(error);
    greeting.textContent = '❌ Error: ' + error.message;
    greeting.className = 'alert alert-danger';
    return;
  }

  greeting.textContent = `✅ Hello ${name}`;
  greeting.className = 'alert alert-success';
  input.value = '';

  // โหลดข้อมูลใหม่
  loadData();
});


/****************************
 * Pagination Functions
 ****************************/

function renderPagination(filteredData) {
  const paginationContainer = document.getElementById('paginationContainer');
  const paginationControls = document.getElementById('paginationControls');

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Hide pagination if only one page or no data
  if (totalPages <= 1) {
    paginationContainer.classList.add('d-none');
    return;
  }

  paginationContainer.classList.remove('d-none');

  // Clear existing controls
  paginationControls.innerHTML = '';

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  const prevLink = document.createElement('a');
  prevLink.className = 'page-link';
  prevLink.href = '#';
  prevLink.innerHTML = 'Previous';
  prevLink.onclick = (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      displayData();
    }
  };
  prevLi.appendChild(prevLink);
  paginationControls.appendChild(prevLi);

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // First page + ellipsis if needed
  if (startPage > 1) {
    const firstLi = document.createElement('li');
    firstLi.className = 'page-item';
    const firstLink = document.createElement('a');
    firstLink.className = 'page-link';
    firstLink.href = '#';
    firstLink.textContent = '1';
    firstLink.onclick = (e) => {
      e.preventDefault();
      currentPage = 1;
      displayData();
    };
    firstLi.appendChild(firstLink);
    paginationControls.appendChild(firstLi);

    if (startPage > 2) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      const ellipsisSpan = document.createElement('span');
      ellipsisSpan.className = 'page-link';
      ellipsisSpan.textContent = '...';
      ellipsisLi.appendChild(ellipsisSpan);
      paginationControls.appendChild(ellipsisLi);
    }
  }

  // Visible page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
    const pageLink = document.createElement('a');
    pageLink.className = 'page-link';
    pageLink.href = '#';
    pageLink.textContent = i;
    pageLink.onclick = (e) => {
      e.preventDefault();
      currentPage = i;
      displayData();
    };
    pageLi.appendChild(pageLink);
    paginationControls.appendChild(pageLi);
  }

  // Last page + ellipsis if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsisLi = document.createElement('li');
      ellipsisLi.className = 'page-item disabled';
      const ellipsisSpan = document.createElement('span');
      ellipsisSpan.className = 'page-link';
      ellipsisSpan.textContent = '...';
      ellipsisLi.appendChild(ellipsisSpan);
      paginationControls.appendChild(ellipsisLi);
    }

    const lastLi = document.createElement('li');
    lastLi.className = 'page-item';
    const lastLink = document.createElement('a');
    lastLink.className = 'page-link';
    lastLink.href = '#';
    lastLink.textContent = totalPages;
    lastLink.onclick = (e) => {
      e.preventDefault();
      currentPage = totalPages;
      displayData();
    };
    lastLi.appendChild(lastLink);
    paginationControls.appendChild(lastLi);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  const nextLink = document.createElement('a');
  nextLink.className = 'page-link';
  nextLink.href = '#';
  nextLink.innerHTML = 'Next';
  nextLink.onclick = (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      displayData();
    }
  };
  nextLi.appendChild(nextLink);
  paginationControls.appendChild(nextLi);
}

function resetPagination() {
  currentPage = 1;
}

/****************************
 * Auto load data on start
 ****************************/

document.addEventListener('DOMContentLoaded', () => {
  // Initialize sort indicator
  const defaultSortHeader = document.querySelector('[data-column="created_at"]');
  if (defaultSortHeader) {
    defaultSortHeader.classList.add('sort-desc');
  }

  loadData();
});










