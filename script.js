const currentPage = window.location.pathname.split('/').pop();

if (currentPage !== 'login.html') {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    }
}

// LOGIN PAGE
if (window.location.pathname.includes('login.html')) {
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      if (username === 'RK' && password === 'RK123') {
          localStorage.setItem('isLoggedIn', 'true');
          window.location.href = 'index.html';
      } else {
          document.getElementById('errorMsg').style.display = 'block';
      }
  });
}

// CHECK LOGIN STATUS FOR EVERY PAGE EXCEPT login.html
if (window.location.pathname.includes('index.html') || window.location.pathname.includes('invoice.html')) {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (isLoggedIn !== 'true') {
      window.location.href = 'login.html';  // Redirect if not logged in
  }
}

// FORM PAGE
if (window.location.pathname.includes('index.html')) {
  const itemCountInput = document.getElementById('itemCount');
  const itemsContainer = document.getElementById('itemsContainer');

  // Logout button creation
  createLogoutButton();

  itemCountInput.addEventListener('change', function() {
      itemsContainer.innerHTML = '';
      const count = parseInt(itemCountInput.value);

      for (let i = 0; i < count; i++) {
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('item-block');
          itemDiv.innerHTML = `
              <h3>Item ${i + 1}</h3>
              <label>Item Name:</label>
              <input type="text" name="itemName${i}" required>

              <label>IMEI Number (optional):</label>
              <input type="text" name="imei${i}">

              <label>Quantity:</label>
              <input type="number" name="quantity${i}" min="1" required>

              <label>Price per Unit:</label>
              <input type="number" name="price${i}" min="0" required>
          `;
          itemsContainer.appendChild(itemDiv);
      }
  });

  const invoiceForm = document.getElementById('invoiceForm');
  invoiceForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const customerName = document.getElementById('customerName').value;
      const itemCount = parseInt(document.getElementById('itemCount').value);
      const items = [];

      for (let i = 0; i < itemCount; i++) {
          const itemName = document.querySelector(`[name='itemName${i}']`).value;
          const imei = document.querySelector(`[name='imei${i}']`).value;
          const quantity = parseInt(document.querySelector(`[name='quantity${i}']`).value);
          const price = parseFloat(document.querySelector(`[name='price${i}']`).value);
          items.push({ itemName, imei, quantity, price });
      }

      localStorage.setItem('invoiceData', JSON.stringify({ customerName, items }));
      window.location.href = 'invoice.html';
  });
}

// INVOICE PAGE
if (window.location.pathname.includes('invoice.html')) {
  const invoiceData = JSON.parse(localStorage.getItem('invoiceData'));

  // Logout button creation
  createLogoutButton();

  if (invoiceData) {
      document.getElementById('customerNamePreview').innerText = invoiceData.customerName;

      // Auto-increment Invoice No.
      let lastInvoiceNo = localStorage.getItem('lastInvoiceNo');
      if (!lastInvoiceNo) {
        lastInvoiceNo = 405;
      } else {
        lastInvoiceNo = parseInt(lastInvoiceNo) + 1;
      }
      localStorage.setItem('lastInvoiceNo', lastInvoiceNo);
      document.getElementById('invoiceNo').innerText = lastInvoiceNo;

      // Set Date
      const today = new Date();
      document.getElementById('invoiceDate').innerText = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

      // Fill table
      const itemsTable = document.getElementById('itemsTable');
      let subTotal = 0;

      invoiceData.items.forEach((item, index) => {
          const amount = item.quantity * item.price;
          subTotal += amount;

          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${index + 1}</td>
              <td>${item.itemName}</td>
              <td>${item.imei || '-'}</td>
              <td>${item.quantity}</td>
              <td>₹${item.price.toFixed(2)}</td>
              <td>₹${amount.toFixed(2)}</td>
          `;
          itemsTable.appendChild(row);
      });

      const totalRow = document.createElement('tr');
      totalRow.innerHTML = `
          <td></td>
          <td><strong>Total</strong></td>
          <td></td>
          <td><strong>${invoiceData.items.reduce((a, b) => a + b.quantity, 0)}</strong></td>
          <td></td>
          <td><strong>₹${subTotal.toFixed(2)}</strong></td>
      `;
      itemsTable.appendChild(totalRow);

      document.getElementById('subTotal').innerText = subTotal.toFixed(2);
      document.getElementById('totalAmount').innerText = subTotal.toFixed(2);
      document.getElementById('receivedAmount').innerText = subTotal.toFixed(2);
      document.getElementById('amountInWords').innerText = numberToWords(subTotal) + ' Rupees only';
  }
}

// Download PDF
function downloadPDF() {
  const invoice = document.getElementById('invoice');
  setTimeout(() => {
      html2pdf().set({
          margin: 0,
          filename: 'invoice.pdf',
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(invoice).save();
  }, 300);
}

// Convert number to words (basic)
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'Overflow';

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
  if (!n) return;

  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' ' : '';
  return str.trim();
}

// Create Logout Button
function createLogoutButton() {
  const container = document.createElement('div');
  container.style.textAlign = 'center';
  container.style.marginTop = '20px';

  const button = document.createElement('button');
  button.textContent = 'Logout';
  button.onclick = function() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('invoiceData');
      window.location.href = 'login.html';
  };

  container.appendChild(button);
  document.body.prepend(container);
}
