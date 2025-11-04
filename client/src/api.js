// src/api.js
const SERVER_BASE = process.env.REACT_APP_SERVER_BASE || 'http://localhost:5000';

async function handleResponse(res) {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json();
}

/* SERVICES */
export async function getServices() {
  const res = await fetch(`${SERVER_BASE}/api/services`);
  const data = await handleResponse(res);
  return data.services || data; // Support both formats
}
export async function createService(body) {
  const res = await fetch(`${SERVER_BASE}/api/services`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
  });
  return handleResponse(res);
}
export async function updateService(id, body) {
  const res = await fetch(`${SERVER_BASE}/api/services/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
  });
  return handleResponse(res);
}
export async function deleteService(id) {
  const res = await fetch(`${SERVER_BASE}/api/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res);
}

/* PAYMENTS */
export async function getPayments(user) {
  const res = await fetch(`${SERVER_BASE}/api/payments?user=${encodeURIComponent(user)}`);
  const data = await handleResponse(res);
  return data.payments || data; // Support both formats
}
export async function createPayment(body) {
  const res = await fetch(`${SERVER_BASE}/api/payments`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
  });
  return handleResponse(res);
}
export async function updatePayment(id, body) {
  const res = await fetch(`${SERVER_BASE}/api/payments/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body)
  });
  return handleResponse(res);
}
export async function deletePayment(id) {
  const res = await fetch(`${SERVER_BASE}/api/payments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res);
}
export async function getPaymentStats(user) {
  const res = await fetch(`${SERVER_BASE}/api/payments/stats/${encodeURIComponent(user)}`);
  const data = await handleResponse(res);
  return data.stats || data;
}

/* USERS */
export async function getUsers() {
  const res = await fetch(`${SERVER_BASE}/api/users`);
  return handleResponse(res);
}

/* ADMIN */
export async function getAdminDashboard() {
  const res = await fetch(`${SERVER_BASE}/api/admin/dashboard`);
  const data = await handleResponse(res);
  return data.dashboard || data;
}

export async function getAllPayments(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${SERVER_BASE}/api/admin/payments?${params}`);
  const data = await handleResponse(res);
  return data.payments || data;
}

export async function getUsersStats() {
  const res = await fetch(`${SERVER_BASE}/api/admin/users/stats`);
  const data = await handleResponse(res);
  return data.userStats || data;
}

export async function getServicesStats() {
  const res = await fetch(`${SERVER_BASE}/api/admin/services/stats`);
  const data = await handleResponse(res);
  return data.serviceStats || data;
}

export async function getMonthlyReport(year, month) {
  const res = await fetch(`${SERVER_BASE}/api/admin/reports/monthly?year=${year}&month=${month}`);
  const data = await handleResponse(res);
  return data.report || data;
}
