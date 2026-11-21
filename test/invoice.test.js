'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function order(id, items, coupon) {
  return {
    id,
    customer: 'In-memory characterization customer',
    paymentMode: 'cash',
    status: 'completed',
    coupon,
    items
  };
}

function calculateBoth(orderRecord) {
  return {
    invoice: invoice.computeInvoiceFigures(orderRecord),
    checkout: pricing.computeTotals(orderRecord.items, orderRecord.coupon)
  };
}

function invoiceSummary(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total,
    rows: result.rows.map((row) => ({
      gstPercent: row.gstPercent,
      line: row.line,
      lineTax: row.lineTax
    }))
  };
}

function checkoutSummary(result) {
  return {
    subtotal: result.subtotal,
    discount: result.discount,
    taxable: result.taxable,
    tax: result.tax,
    cgst: result.cgst,
    sgst: result.sgst,
    total: result.total
  };
}

test('CURRENT BEHAVIOUR: #1001 invoice and checkout figures for 5% and 12% items without a coupon', () => {
  const result = calculateBoth(order(1001, [
    { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006', gstRate: 5 },
    { id: 6, name: 'Ghee', price: 450, qty: 1, hsn: '0405', gstRate: 12 }
  ], ''));

  assert.deepEqual(invoiceSummary(result.invoice), {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 32 },
      { gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
  assert.deepEqual(checkoutSummary(result.checkout), {
    subtotal: 1090,
    discount: 0,
    taxable: 1090,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('EXPECTED BEHAVIOUR: #1002 SAVE10 invoice discounts subtotal before tax', () => {
  const result = calculateBoth(order(1002, [
    { id: 9, name: 'Packaged tea', price: 600, qty: 1, hsn: '0902', gstRate: 18 }
  ], 'SAVE10'));

  assert.deepEqual(invoiceSummary(result.invoice), {
    subtotal: 600,
    discount: 60,
    tax: 97.2,
    cgst: 48.6,
    sgst: 48.6,
    total: 637.2,
    rows: [{ gstPercent: 18, line: 600, lineTax: 97.2 }]
  });
  assert.deepEqual(checkoutSummary(result.checkout), {
    subtotal: 600,
    discount: 60,
    taxable: 540,
    tax: 97.2,
    cgst: 48.6,
    sgst: 48.6,
    total: 637.2
  });
});

test('EXPECTED BEHAVIOUR: #1004 SAVE10 invoice respects the ₹150 cap on a ₹2,240 subtotal', () => {
  const result = calculateBoth(order(1004, [
    { id: 1, name: 'Rice', price: 1120, qty: 1, hsn: '1006', gstRate: 5 },
    { id: 6, name: 'Ghee', price: 1120, qty: 1, hsn: '0405', gstRate: 12 }
  ], 'SAVE10'));

  assert.deepEqual(invoiceSummary(result.invoice), {
    subtotal: 2240,
    discount: 150,
    tax: 177.65,
    cgst: 88.83,
    sgst: 88.82,
    total: 2267.65,
    rows: [
      { gstPercent: 5, line: 1120, lineTax: 52.25 },
      { gstPercent: 12, line: 1120, lineTax: 125.4 }
    ]
  });
  assert.deepEqual(checkoutSummary(result.checkout), {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 177.65,
    cgst: 88.83,
    sgst: 88.82,
    total: 2267.65
  });
});

test('CURRENT BEHAVIOUR: #1008 all-18% items without a coupon', () => {
  const result = calculateBoth(order(1008, [
    { id: 9, name: 'Packaged tea', price: 300, qty: 1, hsn: '0902', gstRate: 18 },
    { id: 11, name: 'Syrup', price: 200, qty: 1, hsn: '2106', gstRate: 18 }
  ], ''));

  assert.deepEqual(invoiceSummary(result.invoice), {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { gstPercent: 18, line: 300, lineTax: 54 },
      { gstPercent: 18, line: 200, lineTax: 36 }
    ]
  });
  assert.deepEqual(checkoutSummary(result.checkout), {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590
  });
});
test('EXPECTED BEHAVIOUR: invoice matches checkout using HSN slabs and pre-tax coupon discount', () => {
  const result = calculateBoth(order(2001, [
    { id: 1, name: 'Rice', price: 640, qty: 1, hsn: '1006' },
    { id: 6, name: 'Ghee', price: 360, qty: 1, hsn: '0405' }
  ], 'SAVE10'));

  assert.deepEqual(invoiceSummary(result.invoice), {
    subtotal: 1000,
    discount: 100,
    tax: 67.68,
    cgst: 33.84,
    sgst: 33.84,
    total: 967.68,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 12, line: 360, lineTax: 38.88 }
    ]
  });
  assert.deepEqual(checkoutSummary(result.checkout), {
    subtotal: 1000,
    discount: 100,
    taxable: 900,
    tax: 67.68,
    cgst: 33.84,
    sgst: 33.84,
    total: 967.68
  });
});
